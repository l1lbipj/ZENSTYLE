import { Link } from 'react-router-dom'
import loginBanner from '../assets/login-banner.jpg'
import logo from '../assets/logo.png'
import '../styles/login.css'

const LoginPage = () => {
  return (
    <div className="auth-page login-page">
      <div className="auth-panel">
        <div className="login-brand">
          <img src={logo} alt="ZenStyle logo" />
          <span>ZENSTYLE</span>
        </div>
        <p className="login-subtitle">Welcome back to the world of exquisite beauty.</p>

        <form className="login-form">
          <label className="auth-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            placeholder="Enter your email..."
          />

          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            placeholder="Enter your password..."
          />

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>
            <Link className="forgot-link" to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="auth-button sign-in-button">Sign in</button>

          <div className="auth-divider">
            <span>Or continue with</span>
          </div>

          <button type="button" className="google-button">
            <span className="google-icon">G</span>
            GOOGLE
          </button>

          <p className="login-footer">
            New to ZenStyle? <Link to="/register">Let's start your beauty story!</Link>
          </p>
        </form>

        <div className="auth-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </div>

      <div className="auth-image">
        <img
          src={loginBanner}
          alt="ZenStyle interior"
        />
      </div>
    </div>
  )
}

export default LoginPage
