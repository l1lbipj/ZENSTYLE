import recoveryPic from '../assets/recovery-pic.png'
import '../styles/recovery.css'

const RecoveryOtpPage = () => {
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
          <h2>Please enter your OTP</h2>
          <div className="otp-row">
            <div className="otp-box" />
            <div className="otp-box" />
            <div className="otp-box" />
            <div className="otp-box" />
          </div>

          <button type="submit" className="auth-button">RESET PASSWORD</button>
        </form>

        <div className="auth-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </div>
    </div>
  )
}

export default RecoveryOtpPage
