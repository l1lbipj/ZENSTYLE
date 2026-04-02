import { Link } from 'react-router-dom'
import registerPrimary from '../assets/register-in.jpg'
import registerSecondary from '../assets/register-warm.png'
import '../styles/register.css'

const RegisterPage = () => {
  return (
    <div className="auth-page register-page">
      <div className="register-media">
        <div className="register-image primary">
          <img
            src={registerPrimary}
            alt="Spa room"
          />
        </div>
        <div className="register-image secondary">
          <img
            src={registerSecondary}
            alt="Spa details"
          />
        </div>
        <h2 className="register-tagline">Begin your journey into pure serenity.</h2>
      </div>

      <div className="auth-panel register-form-wrap">
        <h1>CREATE ACCOUNT</h1>
        <p className="register-subtitle">Join the ZenStyle. Experience the transformation.</p>

        <form className="register-form">
          <label className="auth-label" htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            className="auth-input"
            type="text"
            placeholder="Enter your full name"
          />

          <label className="auth-label" htmlFor="regEmail">Email Address</label>
          <input
            id="regEmail"
            className="auth-input"
            type="email"
            placeholder="Enter your email address"
          />

          <div className="register-row">
            <div className="register-field">
              <label className="auth-label" htmlFor="dob">Date Of Birth</label>
              <div className="input-with-icon">
                <input
                  id="dob"
                  className="auth-input"
                  type="text"
                  placeholder="mm/dd/yy"
                />
                <svg className="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 2v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H9V2H7Zm12 8H5v8h14v-8Z" />
                </svg>
              </div>
            </div>
            <div className="register-field">
              <label className="auth-label" htmlFor="gender">Gender</label>
              <select id="gender" className="auth-input">
                <option>Choose your gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <label className="auth-label" htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            className="auth-input"
            type="tel"
            placeholder="Enter your phone number"
          />

          <div className="register-row">
            <div className="register-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                placeholder="Enter your password"
              />
            </div>
            <div className="register-field">
              <label className="auth-label" htmlFor="confirm">Confirm Your Password</label>
              <input
                id="confirm"
                className="auth-input"
                type="password"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <label className="terms">
            <input type="checkbox" />
            I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
          </label>

          <button type="submit" className="auth-button">CREATE ACCOUNT</button>

          <p className="register-footer">
            Already have a account? <Link to="/login">Login</Link>
          </p>
        </form>

        <div className="auth-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </div>
    </div>
  )
}

export default RegisterPage
