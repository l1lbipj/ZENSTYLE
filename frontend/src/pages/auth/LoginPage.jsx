import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { normalizeRole } from '../../routes/roleConfig'
import loginBanner from '../../assets/login-banner.jpg'
import logo from '../../assets/logo.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = normalizeRole(searchParams.get('role') || 'client')
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: roleParam,
    remember: false,
  })

  useEffect(() => {
    setForm((prev) => ({ ...prev, role: normalizeRole(searchParams.get('role') || prev.role) }))
  }, [searchParams])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('') // Clear error on change
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="zs-auth-screen">
      <div className="zs-auth-split zs-auth-split--reverse">
        <div className="zs-auth-panel zs-auth-panel--wide">
          <div className="zs-auth-brand">
            <img src={logo} alt="ZenStyle logo - beauty salon brand" />
          </div>
          <header className="zs-auth-header zs-auth-header--compact">
            <p className="zs-auth-kicker">Welcome back to the world of exquisite beauty.</p>
          </header>
          <form className="zs-auth-form" onSubmit={handleSubmit}>
            <label className="zs-auth-field">
              <span>Email Address</span>
              <input
                name="email"
                type="email"
                placeholder="Enter your email..."
                value={form.email}
                onChange={handleChange}
                required
                aria-describedby={error ? 'login-error' : undefined}
              />
            </label>
            <label className="zs-auth-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter your password..."
                value={form.password}
                onChange={handleChange}
                required
                aria-describedby={error ? 'login-error' : undefined}
              />
            </label>
            <label className="zs-auth-field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="client">Client</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="zs-auth-row">
              <label className="zs-auth-check">
                <input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} />
                Remember me
              </label>
              <Link to="/forgot-password" className="zs-auth-link">
                Forgot Password?
              </Link>
            </div>
            {error && <div id="login-error" className="zs-auth-error" role="alert">{error}</div>}
            <button type="submit" className="zs-auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="zs-auth-divider">
              <span>Or continue with</span>
            </div>
            {/* TODO: Implement Google OAuth */}
            <button type="button" className="zs-auth-google" aria-label="Continue with Google" disabled>
              <span className="zs-auth-google__icon">G</span>
              Continue with Google (Coming Soon)
            </button>
          </form>
          <p className="zs-auth-note">
            New to ZenStyle? <Link to="/register">Let&apos;s start your beauty story!</Link>
          </p>
          <p className="zs-auth-note">
            <Link to="/">Back to homepage</Link>
          </p>
        </div>
        <div className="zs-auth-media zs-auth-media--full">
          <img src={loginBanner} alt="ZenStyle spa" className="zs-auth-media__hero" />
        </div>
      </div>
      <footer className="zs-auth-footer">©2026 ZenStyle. All Right Reserved</footer>
    </section>
  )
}
