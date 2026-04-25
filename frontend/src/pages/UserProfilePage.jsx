import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Section from '../components/ui/Section'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getRoleRedirectPath } from '../routes/roleRedirect'
import businessApi from '../Api/businessApi'
import { getAccessToken, setAuth } from '../utils/auth'
import { fileToDataUrl, getEntityImage } from '../utils/imageDataUrl'

export default function UserProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [imageData, setImageData] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [originalState, setOriginalState] = useState({
    name: '',
    phone: '',
    dob: '',
    imageData: '',
  })

  const displayName = useMemo(() => {
    const raw = profile?.client_name ?? profile?.staff_name ?? profile?.admin_name ?? profile?.name
    return typeof raw === 'string' && raw.trim() ? raw.trim() : user?.name || ''
  }, [profile, user?.name])

  const displayEmail = useMemo(() => {
    const raw = profile?.email
    return typeof raw === 'string' && raw.trim() ? raw.trim() : user?.email || ''
  }, [profile, user?.email])

  const avatarUrl = useMemo(() => {
    return getEntityImage({ ...profile, image_data: imageData || profile?.image_data }, null)
  }, [imageData, profile])

  const refresh = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await businessApi.myProfile()
      const payload = res?.data?.data || {}
      const nextUser = payload.user || null
      setProfile(nextUser)
      const nextName = (nextUser?.client_name ?? nextUser?.staff_name ?? nextUser?.admin_name ?? nextUser?.name ?? '').toString()
      const nextPhone = (nextUser?.phone ?? '').toString()
      const nextDob = (nextUser?.dob ?? '').toString()
      const nextImageData = (nextUser?.image_data ?? '').toString()
      setName(nextName)
      setPhone(nextPhone)
      setDob(nextDob)
      setImageData(nextImageData)
      setOriginalState({
        name: nextName,
        phone: nextPhone,
        dob: nextDob,
        imageData: nextImageData,
      })

      // Keep AuthContext (stored payload) in sync for navbar name.
      const token = getAccessToken()
      if (token && nextUser) {
        const role = payload.role || user?.role || 'client'
        setAuth({
          access_token: token,
          token_type: 'Bearer',
          user_type: role,
          user: nextUser,
        })
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const nextImage = await fileToDataUrl(file)
      setImageData(nextImage)
      setError('')
      setSuccess('')
    } catch (err) {
      setError(err.message || 'Unable to read image.')
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (user?.role === 'client') {
    return <Navigate to="/client/profile" replace />
  }

  const resetProfileForm = () => {
    setName(originalState.name)
    setPhone(originalState.phone)
    setDob(originalState.dob)
    setImageData(originalState.imageData)
    setError('')
    setSuccess('')
  }

  const resetSecurityForm = () => {
    setPassword('')
    setPasswordConfirmation('')
    setError('')
    setSuccess('')
  }

  const validate = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return 'Name is required.'

    if (password) {
      if (password.length < 8) return 'Password must be at least 8 characters.'
      if (password !== passwordConfirmation) return 'Password confirmation does not match.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      dob: dob || null,
      image_data: imageData || null,
    }

    if (password) {
      payload.password = password
      payload.password_confirmation = passwordConfirmation
    }

    try {
      await businessApi.updateMyProfile(payload)
      setSuccess('Profile updated successfully.')
      setPassword('')
      setPasswordConfirmation('')
      await refresh()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.')
    }
  }

  const handleLogout = async () => {
    setError('')
    setSuccess('')
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="zs-profile">
      <PageHeader
        title="Personal profile"
        subtitle="Manage your personal information, security, and active sessions."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to={getRoleRedirectPath(user?.role)}>
            Back to dashboard
          </Link>
        }
      />

      {loading ? (
        <div className="zs-page-state" role="status" aria-busy="true">
          Loading...
        </div>
      ) : null}
      {!loading && error ? <div className="zs-alert zs-alert--error">{error}</div> : null}
      {!loading && success ? <div className="zs-alert zs-alert--success">{success}</div> : null}

      <div className="zs-profile__layout">
        <div className="zs-profile__card">
          <div className="zs-profile__identity">
            <div className="zs-profile__avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <span>{displayName?.charAt(0)?.toUpperCase() || 'Z'}</span>
              )}
            </div>
            <div>
              <h3>{displayName || 'ZenStyle User'}</h3>
              <p>{displayEmail || 'user@zenstyle.com'}</p>
              <span className="zs-profile__role">{user?.role || 'client'}</span>
            </div>
          </div>

          <div className="zs-profile__actions">
            <Button variant="ghost" size="md" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="zs-profile__content">
          <div className="zs-profile__tabs">
            <button
              type="button"
              className={`zs-tab ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              type="button"
              className={`zs-tab ${activeTab === 'security' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              type="button"
              className={`zs-tab ${activeTab === 'activity' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
          </div>

          {activeTab === 'profile' && (
            <Section title="Account information" description="Keep your contact information up to date.">
              <form className="zs-form" onSubmit={handleSubmit}>
                <div className="zs-profile__grid">
                  <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Email" type="email" value={displayEmail} disabled />
                  <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <label className="zs-field">
                  <span className="zs-field__label">Profile image</span>
                  <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
                </label>
                {imageData ? (
                  <Button variant="ghost" type="button" onClick={() => setImageData('')}>
                    Remove image
                  </Button>
                ) : null}
                <div className="zs-profile__form-actions">
                  <Button type="submit">Save changes</Button>
                  <Button variant="ghost" type="button" onClick={resetProfileForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Section>
          )}

          {activeTab === 'security' && (
            <Section title="Security" description="Control your account access and sessions.">
              <form className="zs-form" onSubmit={handleSubmit}>
                <div className="zs-profile__grid">
                  <Input
                    label="New password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </div>
                <div className="zs-profile__form-actions">
                  <Button type="submit">Update password</Button>
                  <Button variant="ghost" type="button" onClick={resetSecurityForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Section>
          )}

          {activeTab === 'activity' && (
            <Section title="Recent activity" description="Coming soon.">
              <Card title="Activity" description="We’ll show recent logins and changes here." />
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

