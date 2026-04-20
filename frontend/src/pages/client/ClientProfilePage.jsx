import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'

export default function ClientProfilePage() {
  const [form, setForm] = useState({
    client_name: '',
    email: '',
    phone: '',
    dob: '',
    image_data: '',
  })
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)
  const [catalogAllergies, setCatalogAllergies] = useState([])
  const [selectedAllergyIds, setSelectedAllergyIds] = useState([])
  const [customAllergies, setCustomAllergies] = useState([])
  const [customAllergyInput, setCustomAllergyInput] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([businessApi.myProfile(), businessApi.clientPreferences()])
      .then(([profileRes, preferencesRes]) => {
        if (!mounted) return
        const user = profileRes?.data?.data?.user || {}
        const preferencePayload = preferencesRes?.data?.data || {}
        const serverAllergies = preferencePayload?.allergies || []
        const availableAllergies = preferencePayload?.available_allergies || []
        setForm({
          client_name: user.client_name || '',
          email: user.email || '',
          phone: user.phone || '',
          dob: user.dob || '',
          image_data: user.image_data || '',
        })
        setCatalogAllergies(availableAllergies)
        setSelectedAllergyIds(serverAllergies.map((item) => Number(item.allergy_id)).filter((id) => Number.isFinite(id)))
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
  }, [])

  const initials = useMemo(() => {
    return (
      form.client_name
        ?.trim()
        ?.split(/\s+/)
        ?.slice(0, 2)
        ?.map((part) => part.charAt(0).toUpperCase())
        ?.join('') || 'CL'
    )
  }, [form.client_name])

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const image_data = await fileToDataUrl(file)
      setForm((prev) => ({ ...prev, image_data }))
      setMessage('')
    } catch (err) {
      setMessageTone('error')
      setMessage(err.message || 'Unable to read image.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    businessApi
      .updateMyProfile({
        ...form,
        allergy_ids: selectedAllergyIds,
        custom_allergies: customAllergies,
      })
      .then(() => {
        setMessageTone('success')
        setMessage('Profile updated successfully.')
      })
      .catch((err) => {
        setMessageTone('error')
        setMessage(err?.response?.data?.message || 'Failed to update profile.')
      })
  }

  const toggleAllergy = (allergyId) => {
    setSelectedAllergyIds((prev) => (prev.includes(allergyId) ? prev.filter((item) => item !== allergyId) : [...prev, allergyId]))
  }

  const addCustomAllergy = () => {
    const next = customAllergyInput.trim()
    if (!next) return
    if (customAllergies.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setCustomAllergyInput('')
      return
    }
    setCustomAllergies((prev) => [...prev, next])
    setCustomAllergyInput('')
  }

  const selectedCatalogAllergies = useMemo(
    () => catalogAllergies.filter((item) => selectedAllergyIds.includes(Number(item.allergy_id))),
    [catalogAllergies, selectedAllergyIds],
  )

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My profile"
        subtitle="Keep your contact details and profile photo up to date."
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
              {form.image_data ? (
                <img
                  src={getEntityImage(form, 'https://ui-avatars.com/api/?name=Client')}
                  alt="Client profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{form.client_name || 'ZenStyle client'}</h3>
              <p className="zs-card__description">{form.email || 'No email available'}</p>
              <p className="zs-card__description">{form.phone || 'No phone number yet'}</p>
              {selectedCatalogAllergies.length > 0 || customAllergies.length > 0 ? (
                <p className="zs-card__description">
                  Allergies: {[...selectedCatalogAllergies.map((item) => item.allergy_name), ...customAllergies].join(', ')}
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
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/rewards">
              View rewards
            </Link>
          </div>
        </Card>
      </div>

      <Section title="Personal details" description="Update the information attached to your appointments and account.">
        {loading ? <p className="zs-card__description">Loading profile...</p> : null}
        {!loading ? (
          <form className="zs-form" onSubmit={handleSubmit}>
            <div className="zs-profile__grid">
              <Input label="Full name" value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input label="Date of birth" type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />
            </div>
            <label className="zs-field">
              <span className="zs-field__label">Profile image</span>
              <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
              <span className="zs-field__hint">Choose a clear photo so your account feels more personal.</span>
            </label>
            <div className="zs-field">
              <span className="zs-field__label">Allergies</span>
              <div className="zs-action-row">
                {catalogAllergies.map((item) => {
                  const allergyId = Number(item.allergy_id)
                  const active = selectedAllergyIds.includes(allergyId)
                  return (
                    <button
                      key={item.allergy_id}
                      type="button"
                      className={`zs-btn zs-btn--sm ${active ? 'zs-btn--primary' : 'zs-btn--ghost'}`}
                      onClick={() => toggleAllergy(allergyId)}
                    >
                      {item.allergy_name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="zs-field">
              <span className="zs-field__label">Custom allergy</span>
              <div className="zs-action-row">
                <input
                  className="zs-input"
                  placeholder="Type custom allergy"
                  value={customAllergyInput}
                  onChange={(e) => setCustomAllergyInput(e.target.value)}
                />
                <Button type="button" variant="ghost" onClick={addCustomAllergy}>Add</Button>
              </div>
              {customAllergies.length > 0 ? (
                <div className="zs-action-row">
                  {customAllergies.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="zs-btn zs-btn--sm zs-btn--ghost"
                      onClick={() => setCustomAllergies((prev) => prev.filter((x) => x !== item))}
                    >
                      {item} x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="zs-action-row">
              <Button type="submit">Save changes</Button>
              {form.image_data ? (
                <Button type="button" variant="ghost" onClick={() => setForm((p) => ({ ...p, image_data: null }))}>
                  Remove image
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </Section>
    </div>
  )
}
