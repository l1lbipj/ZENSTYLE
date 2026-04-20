import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'

export default function StaffProfilePage() {
  const [form, setForm] = useState({
    staff_name: '',
    email: '',
    phone: '',
    dob: '',
    specialization: '',
    image_data: '',
  })
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)

  const displayName = useMemo(() => form.staff_name || 'ZenStyle staff', [form.staff_name])
  const displayEmail = useMemo(() => form.email || 'No email provided', [form.email])
  const initials = useMemo(() => {
    return (
      displayName
        ?.trim()
        ?.split(/\s+/)
        ?.slice(0, 2)
        ?.map((part) => part.charAt(0).toUpperCase())
        ?.join('') || 'ST'
    )
  }, [displayName])
  const avatarUrl = useMemo(() => getEntityImage(form, null), [form])

  useEffect(() => {
    let mounted = true

    businessApi
      .myProfile()
      .then((response) => {
        if (!mounted) return
        const user = response?.data?.data?.user || {}
        setForm({
          staff_name: user.staff_name || user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          dob: user.dob || '',
          specialization: user.specialization || '',
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setMessageTone('success')

    if (!form.staff_name.trim()) {
      setMessageTone('error')
      setMessage('Name is required.')
      return
    }

    try {
      await businessApi.updateMyProfile({
        staff_name: form.staff_name.trim(),
        phone: form.phone.trim() || null,
        dob: form.dob || null,
        specialization: form.specialization.trim() || null,
        image_data: form.image_data || null,
      })
      setMessageTone('success')
      setMessage('Profile updated successfully.')
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.response?.data?.message || 'Failed to update profile.')
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My profile"
        subtitle="Keep your staff profile details and profile photo up to date."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/staff">
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
                <img src={avatarUrl} alt="Staff profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{displayName}</h3>
              <p className="zs-card__description">{displayEmail}</p>
              <p className="zs-card__description">{form.phone || 'No phone number yet'}</p>
              {form.specialization ? <p className="zs-card__description">{form.specialization}</p> : null}
            </div>
          </div>
        </Card>

        <Card title="Quick actions" description="Go to the places staff use most often.">
          <div className="zs-action-row">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/staff/schedule">
              Work schedule
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/staff/tasks">
              Assigned tasks
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/staff/feedbacks">
              Feedbacks
            </Link>
          </div>
        </Card>
      </div>

      <Section title="Personal details" description="Update the information attached to your profile.">
        {loading ? <p className="zs-card__description">Loading profile...</p> : null}
        {!loading ? (
          <form className="zs-form" onSubmit={handleSubmit}>
            <div className="zs-profile__grid">
              <Input label="Full name" value={form.staff_name} onChange={(e) => setForm((prev) => ({ ...prev, staff_name: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Input label="Date of birth" type="date" value={form.dob} onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))} />
            </div>
            <Input label="Specialization" value={form.specialization} onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))} />
            <label className="zs-field">
              <span className="zs-field__label">Profile image</span>
              <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
              <span className="zs-field__hint">Choose a clear photo so your account feels more personal.</span>
            </label>
            <div className="zs-action-row">
              <Button type="submit">Save changes</Button>
              {form.image_data ? (
                <Button type="button" variant="ghost" onClick={() => setForm((prev) => ({ ...prev, image_data: '' }))}>
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
