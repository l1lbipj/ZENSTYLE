import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField } from '../../components/forms/FormField'

const initialForm = {
  admin_name: '',
  email: '',
  phone: '',
  dob: '',
  image_data: '',
}

function validateAdmin(values) {
  const errors = {}
  const name = String(values.admin_name || '').trim()
  const email = String(values.email || '').trim()
  const phone = String(values.phone || '').trim()

  if (!name) errors.admin_name = 'Full name is required.'
  else if (name.length < 2) errors.admin_name = 'Full name must be at least 2 characters.'

  if (!email) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'

  if (phone && phone.replace(/[\s()+-]/g, '').length < 8) {
    errors.phone = 'Phone number looks too short.'
  }

  return errors
}

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const form = useFormDraft(initialForm, validateAdmin)
  const resetForm = form.reset

  const displayName = useMemo(() => form.values.admin_name || 'ZenStyle admin', [form.values.admin_name])
  const displayEmail = useMemo(() => form.values.email || 'No email provided', [form.values.email])
  const initials = useMemo(() => {
    return (
      displayName
        ?.trim()
        ?.split(/\s+/)
        ?.slice(0, 2)
        ?.map((part) => part.charAt(0).toUpperCase())
        ?.join('') || 'AD'
    )
  }, [displayName])
  const avatarUrl = useMemo(() => getEntityImage(form.values, null), [form.values])

  useEffect(() => {
    let mounted = true

    businessApi
      .myProfile()
      .then((response) => {
        if (!mounted) return
        const user = response?.data?.data?.user || {}
        resetForm({
          admin_name: user.admin_name || user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          dob: user.dob || '',
          image_data: user.image_data || '',
        })
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

    if (!form.dirty) {
      setMessageTone('success')
      setMessage('No changes to save.')
      return
    }

    setSaving(true)
    try {
      await businessApi.updateMyProfile({
        admin_name: form.values.admin_name.trim(),
        phone: form.values.phone.trim() || null,
        dob: form.values.dob || null,
        image_data: form.values.image_data || null,
      })
      form.reset({
        admin_name: form.values.admin_name.trim(),
        email: form.values.email.trim(),
        phone: form.values.phone.trim(),
        dob: form.values.dob || '',
        image_data: form.values.image_data || '',
      })
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
        subtitle="Keep your admin profile details and profile photo up to date."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/admin">
            Back to dashboard
          </Link>
        }
      />

      {message ? <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Profile card" description="This is the information we use across your account.">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="zs-profile__avatar" style={{ width: 84, height: 84, borderRadius: 24, overflow: 'hidden' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Admin profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{displayName}</h3>
              <p className="zs-card__description">{displayEmail}</p>
              <p className="zs-card__description">{form.values.phone || 'No phone number yet'}</p>
            </div>
          </div>
        </Card>

        <Card title="Quick actions" description="Go to the places admin use most often.">
          <div className="zs-action-row">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/admin/staff">
              Staff management
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/admin/services">
              Services
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/admin/reports">
              Reports
            </Link>
          </div>
        </Card>
      </div>

      <Section title="Personal details" description="Update the information attached to your profile.">
        {loading ? <p className="zs-card__description">Loading profile...</p> : null}
        {!loading ? (
          <form className="zs-form" onSubmit={handleSubmit}>
            <FormSection title="Basic information" description="Use your real name and contact details for a clean account profile.">
              <div className="zs-profile__grid">
                <InputField
                  label="Full name"
                  required
                  placeholder="Michael Brown"
                  {...form.bindInput('admin_name')}
                  error={form.touched.admin_name ? form.errors.admin_name : ''}
                />
                <InputField
                  label="Email"
                  required
                  type="email"
                  placeholder="michael@zenstyle.com"
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
                <InputField
                  label="Date of birth"
                  type="date"
                  {...form.bindInput('dob')}
                />
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

            <FormActions
              primaryLabel={saving ? 'Saving...' : 'Save Changes'}
              onSecondary={() => resetForm()}
              secondaryLabel="Reset"
              primaryProps={{ disabled: saving || !form.dirty || form.hasErrors }}
              secondaryProps={{ disabled: saving || !form.dirty }}
            />
          </form>
        ) : null}
      </Section>
    </div>
  )
}
