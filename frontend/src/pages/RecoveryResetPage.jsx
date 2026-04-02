import recoveryPic from '../assets/recovery-pic.png'
import '../styles/recovery.css'

const RecoveryResetPage = () => {
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
          <label className="auth-label" htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            className="auth-input"
            type="password"
            placeholder="Enter your new password..."
          />

          <label className="auth-label" htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            className="auth-input"
            type="password"
            placeholder="Confirm your new password..."
          />

          <button type="submit" className="auth-button">RESET PASSWORD</button>
        </form>

        <div className="auth-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </div>
    </div>
  )
}

export default RecoveryResetPage
