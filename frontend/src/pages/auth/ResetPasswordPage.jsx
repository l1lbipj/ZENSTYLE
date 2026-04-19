import recoveryPic from '../../assets/recovery-pic.png'
import logo from '../../assets/logo.png'

export default function ResetPasswordPage() {
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
            <label className="zs-auth-field">
              <span>New Password</span>
              <input type="password" placeholder="Enter your new password..." required />
            </label>
            <label className="zs-auth-field">
              <span>Confirm New Password</span>
              <input type="password" placeholder="Confirm your new password..." required />
            </label>
            <button type="submit" className="zs-auth-btn">
              Reset password
            </button>
          </form>
        </div>
      </div>
      <footer className="zs-auth-footer">©2026 ZenStyle. All Right Reserved</footer>
    </section>
  )
}
