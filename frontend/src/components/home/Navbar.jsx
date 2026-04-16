import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import authApi from '../../Api/authApi'
import { getUser, logout as clearLocalAuth } from '../../utils/auth'

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
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentUser = getUser()
  const displayName = currentUser?.client_name || currentUser?.staff_name || currentUser?.admin_name || currentUser?.email

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (_error) {
      // Always clear local auth even if API call fails.
    } finally {
      clearLocalAuth()
      setMenuOpen(false)
      navigate('/login')
    }
  }

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
          {displayName ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="zs-btn zs-btn--gold zs-nav__login"
                title={displayName}
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {displayName}
              </button>

              {menuOpen ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '160px',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    zIndex: 50,
                  }}
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 14px',
                      color: '#111827',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      color: '#dc2626',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="zs-btn zs-btn--gold zs-nav__login">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
