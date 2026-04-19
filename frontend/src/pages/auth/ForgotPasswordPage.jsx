import { Link } from 'react-router-dom'
import recoveryPic from '../../assets/recovery-pic.png'
import logo from '../../assets/logo.png'

export default function ForgotPasswordPage() {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <section className="zs-auth-screen">
      <div className="zs-auth-split">
        <div className="zs-auth-media">
          <div className="zs-auth-media__card">
            <img src={recoveryPic} alt="ZenStyle recovery" className="zs-auth-media__image" />
            <div className="zs-auth-media__overlay">
              <img src={logo} alt="ZenStyle" className="zs-auth-media__logo" />
              <p>Where beauty meets serenity.</p>
            </div>
          </div>
        </div>
        <div className="zs-auth-panel">
          <header className="zs-auth-header">
            <h1>Recovery your password</h1>
            <p>Enter your email to receive a password reset link. We&apos;ll help you get back to your account.</p>
          </header>
          <form className="zs-auth-form" onSubmit={handleSubmit}>
            <label className="zs-auth-field zs-auth-field--icon">
              <span>Email Address</span>
              <div className="zs-auth-input">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m22 8-10 6L2 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input type="email" placeholder="Enter your email address" required />
              </div>
            </label>
            <button type="submit" className="zs-auth-btn">
              Reset password
            </button>
          </form>
          <div className="zs-auth-links">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
      <footer className="zs-auth-footer">©2026 ZenStyle. All Right Reserved</footer>
    </section>
  )
}
