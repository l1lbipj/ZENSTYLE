import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

function IconCart() {
  return (
    <svg className="zs-nav__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 2h3l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBell() {
  return (
    <svg className="zs-nav__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Navbar() {
  return (
    <header className="zs-nav">
      <div className="zs-nav__inner">
        <Link to="/" className="zs-nav__brand">
          <img src={logo} alt="ZenStyle" className="zs-nav__logo" width={120} height={48} />
        </Link>

        <nav className="zs-nav__links" aria-label="Main">
          <Link to="/">Home</Link>
          <a href="#services">Product</a>
          <a href="#services">Service</a>
          <a href="#about">About ZenStyle</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="zs-nav__actions">
          <button type="button" className="zs-nav__icon-btn" aria-label="Shopping cart">
            <IconCart />
          </button>
          <button type="button" className="zs-nav__icon-btn" aria-label="Notifications">
            <IconBell />
          </button>
          <Link to="/login" className="zs-btn zs-btn--gold zs-nav__login">
            Login
          </Link>
        </div>
      </div>
    </header>
  )
}
