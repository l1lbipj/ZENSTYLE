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

  useEffect(() => {
    let mounted = true
    businessApi
      .myProfile()
      .then((res) => {
        if (!mounted) return
        const user = res?.data?.data?.user || {}
        setForm({
          client_name: user.client_name || '',
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
      .updateMyProfile(form)
      .then(() => {
        setMessageTone('success')
        setMessage('Profile updated successfully.')
      })
      .catch((err) => {
        setMessageTone('error')
        setMessage(err?.response?.data?.message || 'Failed to update profile.')
      })
  }

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
