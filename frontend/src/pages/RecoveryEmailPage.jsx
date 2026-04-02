import { Link } from 'react-router-dom'
import recoveryPic from '../assets/recovery-pic.png'
import '../styles/recovery.css'

const RecoveryEmailPage = () => {
  return (
    <div className="auth-page recovery-page">
      <div className="recovery-media">
        <div className="recovery-card">
          <img
            src={recoveryPic}
            alt="ZenStyle recovery"
          />
        </div>
      </div>

      <div className="auth-panel">
        <h1 className="auth-title recovery-brand">RECOVERY YOUR PASSWORD</h1>
        <p className="recovery-subtitle">
          Enter your email to receive a password reset link. We'll help you get back to your account.
        </p>

        <form className="recovery-form">
          <label className="auth-label" htmlFor="recoveryEmail">Email Address</label>
          <div className="input-with-icon">
            <svg className="input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
            </svg>
            <input
              id="recoveryEmail"
              className="auth-input"
              type="email"
              placeholder="Enter your email address"
            />
          </div>

          <button type="submit" className="auth-button">RESET PASSWORD</button>

          <div className="recovery-actions">
            <Link to="/login">Back to Login</Link>
          </div>
        </form>

        <div className="auth-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </div>
    </div>
  )
}

export default RecoveryEmailPage
