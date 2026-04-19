import { Link } from 'react-router-dom'
import recoveryPic from '../../assets/recovery-pic.png'
import logo from '../../assets/logo.png'

export default function OtpPage() {
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
            <h2 className="zs-auth-form__title">Please enter your OTP</h2>
            <div className="zs-otp">
              {Array.from({ length: 4 }).map((_, index) => (
                <input
                  key={index}
                  className="zs-otp__input"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${index + 1}`}
                  required
                />
              ))}
            </div>
            <button type="submit" className="zs-auth-btn">
              Reset password
            </button>
          </form>
          <div className="zs-auth-links">
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </div>
      <footer className="zs-auth-footer">©2026 ZenStyle. All Right Reserved</footer>
    </section>
  )
}
