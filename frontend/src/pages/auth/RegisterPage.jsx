import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import registerWarm from '../../assets/register-warm.png'
import registerIn from '../../assets/register-in.jpg'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.terms) {
      setError('You must accept the terms of service and privacy policy.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!form.name || !form.email || !form.password) {
      setError('Full name, email, and password are required.')
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: 'client',
      })
      navigate('/', { replace: true })
    } catch (err) {
      const responseData = err?.response?.data
      const firstFieldError =
        responseData?.errors && typeof responseData.errors === 'object'
          ? Object.values(responseData.errors)?.flat?.()?.[0]
          : null
      setError(firstFieldError || responseData?.message || err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="zs-auth-screen">
      <div className="zs-auth-register">
        <div className="zs-auth-register__visual">
          <div className="zs-auth-register__image zs-auth-register__image--large">
            <img src={registerIn} alt="ZenStyle spa room" />
          </div>
          <div className="zs-auth-register__image zs-auth-register__image--small">
            <img src={registerWarm} alt="ZenStyle ritual" />
          </div>
          <div className="zs-auth-register__headline">
            <h2>Begin your journey</h2>
            <p>into pure serenity.</p>
          </div>
        </div>
        <div className="zs-auth-panel zs-auth-panel--wide">
          <header className="zs-auth-header">
            <h1>Create account</h1>
            <p>Join the ZenStyle. Experience the transformation.</p>
          </header>
          <form className="zs-auth-form" onSubmit={handleSubmit}>
            <label className="zs-auth-field">
              <span>Full Name</span>
              <input name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="zs-auth-field">
              <span>Email Address</span>
              <input
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <div className="zs-auth-grid">
              <label className="zs-auth-field">
                <span>Date Of Birth</span>
                <input
                  name="dob"
                  type="date"
                  placeholder="mm/dd/yy"
                  value={form.dob}
                  onChange={handleChange}
                />
              </label>
              <label className="zs-auth-field">
                <span>Gender</span>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Choose your gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <label className="zs-auth-field">
              <span>Phone Number</span>
              <input
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
              />
            </label>
            <div className="zs-auth-grid">
              <label className="zs-auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="zs-auth-field">
                <span>Confirm Your Password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <label className="zs-auth-check zs-auth-check--terms">
              <input name="terms" type="checkbox" checked={form.terms} onChange={handleChange} required />
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </label>
            {error && (
              <div className="zs-auth-error" role="alert" aria-live="assertive">
                {error}
              </div>
            )}
            <button type="submit" className="zs-auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="zs-auth-note">
            Already have a account? <Link to="/login">Login</Link>
          </p>
          <p className="zs-auth-note">
            <Link to="/">Back to homepage</Link>
          </p>
        </div>
      </div>
      <footer className="zs-auth-footer">©2026 ZenStyle. All Right Reserved</footer>
    </section>
  )
}
