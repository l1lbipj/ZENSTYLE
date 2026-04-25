import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField, MultiSelect } from '../../components/forms/FormField'

const initialForm = {
  client_name: '',
  email: '',
  phone: '',
  dob: '',
  image_data: '',
}

function validateClient(values) {
  const errors = {}
  const name = String(values.client_name || '').trim()
  const email = String(values.email || '').trim()
  const phone = String(values.phone || '').trim()

  if (!name) errors.client_name = 'Full name is required.'
  else if (name.length < 2) errors.client_name = 'Full name must be at least 2 characters.'

  if (!email) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'

  if (phone && phone.replace(/[\s()+-]/g, '').length < 8) {
    errors.phone = 'Phone number looks too short.'
  }

  return errors
}

function isSameList(a, b) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [catalogAllergies, setCatalogAllergies] = useState([])
  const [selectedAllergyIds, setSelectedAllergyIds] = useState([])
  const [archivedAllergies, setArchivedAllergies] = useState([])
  const [favoriteProducts, setFavoriteProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [favoriteStaff, setFavoriteStaff] = useState([])
  const initialAllergyIdsRef = useRef([])
  const form = useFormDraft(initialForm, validateClient)
  const resetForm = form.reset

  useEffect(() => {
    let mounted = true

    Promise.all([businessApi.myProfile(), businessApi.clientPreferences()])
      .then(([profileRes, preferencesRes]) => {
        if (!mounted) return
        const user = profileRes?.data?.data?.user || {}
        const preferencePayload = preferencesRes?.data?.data || {}
        const serverAllergies = preferencePayload?.allergies || []
        const availableAllergies = preferencePayload?.available_allergies || []
        const archived = preferencePayload?.archived_allergies || []
        const preferredStaff = preferencePayload?.preferred_staff || profileRes?.data?.data?.preferred_staff || []
        const savedProducts = preferencePayload?.favorite_products || profileRes?.data?.data?.favorite_products || []
        const purchasedProducts = preferencePayload?.top_products || profileRes?.data?.data?.top_products || []
        const allergyIds = serverAllergies
          .map((item) => Number(item.allergy_id))
          .filter((id) => Number.isFinite(id))

        resetForm({
          client_name: user.client_name || '',
          email: user.email || '',
          phone: user.phone || '',
          dob: user.dob || '',
          image_data: user.image_data || '',
        })
        initialAllergyIdsRef.current = allergyIds
        setSelectedAllergyIds(allergyIds)
        setCatalogAllergies(availableAllergies)
        setArchivedAllergies(archived)
        setFavoriteStaff(preferredStaff)
        setFavoriteProducts(savedProducts)
        setTopProducts(purchasedProducts)
      })
      .catch(() => {
        if (!mounted) return
        setMessageTone('error')
        setMessage('Unable to load profile.')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [resetForm])

  const displayName = useMemo(() => form.values.client_name || 'ZenStyle client', [form.values.client_name])
  const initials = useMemo(() => {
    return (
      displayName
        ?.trim()
        ?.split(/\s+/)
        ?.slice(0, 2)
        ?.map((part) => part.charAt(0).toUpperCase())
        ?.join('') || 'CL'
    )
  }, [displayName])
  const avatarUrl = useMemo(() => getEntityImage(form.values, 'https://ui-avatars.com/api/?name=Client'), [form.values])
  const allergyOptions = useMemo(
    () =>
      catalogAllergies.map((item) => ({
        value: Number(item.allergy_id),
        label: item.allergy_name,
      })),
    [catalogAllergies],
  )
  const selectedCatalogAllergies = useMemo(
    () => catalogAllergies.filter((item) => selectedAllergyIds.includes(Number(item.allergy_id))),
    [catalogAllergies, selectedAllergyIds],
  )
  const preferenceDirty = !isSameList([...selectedAllergyIds].sort((a, b) => a - b), [...initialAllergyIdsRef.current].sort((a, b) => a - b))
  const isDirty = form.dirty || preferenceDirty

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const image_data = await fileToDataUrl(file)
      form.setFieldValue('image_data', image_data)
      setMessage('')
    } catch (err) {
      setMessageTone('error')
      setMessage(err.message || 'Unable to read image.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const errors = form.validateAll()
    if (Object.keys(errors).length > 0) return

    if (!isDirty) {
      setMessageTone('success')
      setMessage('No changes to save.')
      return
    }

    setSaving(true)
    try {
      await businessApi.updateMyProfile({
        client_name: form.values.client_name.trim(),
        email: form.values.email.trim(),
        phone: form.values.phone.trim() || null,
        dob: form.values.dob || null,
        image_data: form.values.image_data || null,
        allergy_ids: selectedAllergyIds,
      })
      form.reset({
        client_name: form.values.client_name.trim(),
        email: form.values.email.trim(),
        phone: form.values.phone.trim(),
        dob: form.values.dob || '',
        image_data: form.values.image_data || '',
      })
      initialAllergyIdsRef.current = [...selectedAllergyIds]
      setMessageTone('success')
      setMessage('Profile updated successfully.')
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My profile"
        subtitle="Keep your contact details, photo, and allergy preferences up to date."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/">
            Back to home
          </Link>
        }
      />

      {message ? <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Profile card" description="This is the information we use across your account.">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="zs-profile__avatar" style={{ width: 84, height: 84, borderRadius: 24, overflow: 'hidden' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Client profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{displayName}</h3>
              <p className="zs-card__description">{form.values.email || 'No email available'}</p>
              <p className="zs-card__description">{form.values.phone || 'No phone number yet'}</p>
              {selectedCatalogAllergies.length > 0 || archivedAllergies.length > 0 ? (
                <p className="zs-card__description">
                  Allergies: {[...selectedCatalogAllergies.map((item) => item.allergy_name), ...archivedAllergies.map((item) => item.allergy_name)].join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <Card title="Quick actions" description="Go to the places clients use most often.">
          <div className="zs-action-row">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
              Book appointment
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
              My appointments
            </Link>
          </div>
        </Card>
      </div>

      <Section title="Favorite picks" description="Your saved favorites and most purchased items.">
        <div className="zs-dashboard__row">
          <Card title="Favorite products" description={`${favoriteProducts.length} saved product${favoriteProducts.length === 1 ? '' : 's'} from your profile`}>
            {favoriteProducts.length > 0 ? (
              <div className="zs-profile__favorite-list">
                {favoriteProducts.map((item) => (
                  <div key={item.product_id} className="zs-profile__favorite-item">
                    <div>
                      <strong>{item.product_name}</strong>
                      <p>{item.category || 'Product'}</p>
                    </div>
                    <span>${Number(item.unit_price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="zs-card__description">No favorite products saved yet.</p>
            )}
          </Card>

          <Card title="Top products" description={`${topProducts.length} product${topProducts.length === 1 ? '' : 's'} from purchase history`}>
            {topProducts.length > 0 ? (
              <div className="zs-profile__favorite-list">
                {topProducts.map((item) => (
                  <div key={item.product_id} className="zs-profile__favorite-item">
                    <div>
                      <strong>{item.product_name}</strong>
                      <p>{item.category || 'Product'}</p>
                    </div>
                    <span>{Number(item.usage_count || 0)} bought</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="zs-card__description">No purchased products yet.</p>
            )}
          </Card>

          <Card title="Top staff" description={`${favoriteStaff.length} staff member${favoriteStaff.length === 1 ? '' : 's'} from appointment history`}>
            {favoriteStaff.length > 0 ? (
              <div className="zs-profile__favorite-list">
                {favoriteStaff.map((item) => (
                  <div key={item.staff_id} className="zs-profile__favorite-item">
                    <div>
                      <strong>{item.staff_name}</strong>
                      <p>{item.specialization || 'Staff member'}</p>
                    </div>
                    <span>{Number(item.usage_count || 0)} bookings</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="zs-card__description">No completed appointments yet.</p>
            )}
          </Card>
        </div>
      </Section>

      <Section title="Personal details" description="Update the information attached to your appointments and account.">
        {loading ? <p className="zs-card__description">Loading profile...</p> : null}
        {!loading ? (
          <form className="zs-form" onSubmit={handleSubmit}>
            <FormSection title="Basic information" description="Use your real details so bookings and notifications stay accurate.">
              <div className="zs-profile__grid">
                <InputField
                  label="Full name"
                  required
                  placeholder="Michael Brown"
                  {...form.bindInput('client_name')}
                  error={form.touched.client_name ? form.errors.client_name : ''}
                />
                <InputField
                  label="Email"
                  required
                  type="email"
                  placeholder="michael@example.com"
                  {...form.bindInput('email')}
                  error={form.touched.email ? form.errors.email : ''}
                />
                <InputField
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...form.bindInput('phone')}
                  error={form.touched.phone ? form.errors.phone : ''}
                />
                <InputField label="Date of birth" type="date" {...form.bindInput('dob')} />
              </div>
            </FormSection>

            <FormSection title="Media" description="Use a clear profile photo so your account feels more personal.">
              <label className="zs-field">
                <span className="zs-field__label">Profile image</span>
                <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
                <span className="zs-field__hint">Recommended: square image, at least 512px.</span>
              </label>
              {form.values.image_data ? (
                <button
                  type="button"
                  className="zs-btn zs-btn--ghost zs-btn--sm"
                  onClick={() => form.setFieldValue('image_data', '')}
                >
                  Remove image
                </button>
              ) : null}
            </FormSection>

            <FormSection title="Allergy preferences" description="Select the allergy tags that staff should see before appointments.">
              <MultiSelect
                label="Allergies"
                hint={catalogAllergies.length ? 'Only admin-defined allergies can be selected.' : 'No allergy options available yet.'}
                options={allergyOptions}
                value={selectedAllergyIds}
                onChange={setSelectedAllergyIds}
              />
              {archivedAllergies.length > 0 ? (
                <div className="zs-field">
                  <span className="zs-field__label">Archived selections</span>
                  <div className="zs-action-row">
                    {archivedAllergies.map((item) => (
                      <span key={item.allergy_id} className="zs-chip is-active">
                        {item.allergy_name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </FormSection>

            <FormActions
              primaryLabel={saving ? 'Saving...' : 'Save Changes'}
              onSecondary={() => {
                resetForm()
                setSelectedAllergyIds(initialAllergyIdsRef.current)
              }}
              secondaryLabel="Reset"
              primaryProps={{ disabled: saving || !isDirty || form.hasErrors }}
              secondaryProps={{ disabled: saving || !isDirty }}
            />
          </form>
        ) : null}
      </Section>
    </div>
  )
}
