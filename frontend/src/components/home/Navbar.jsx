import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/useAuth'
import { useCart } from '../../context/useCart'
import { getRoleRedirectPath } from '../../routes/roleRedirect'

function IconUser() {
  return (
    <svg className="zs-nav__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

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
  const { user, logout } = useAuth()
  const { totalQuantity } = useCart()
  const navigate = useNavigate()
  const dashboardPath = user ? (user.role === 'client' ? '/client' : getRoleRedirectPath(user.role)) : '/login'
  const profilePath = user
    ? user.role === 'client'
      ? '/client/profile'
      : user.role === 'staff'
      ? '/staff/profile'
      : user.role === 'admin'
      ? '/admin/profile'
      : '/profile'
    : '/login'
  const cartLabel =
    totalQuantity > 0 ? `Shopping cart, ${totalQuantity} items` : 'Shopping cart, empty'

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const handleNotifications = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'staff') {
      navigate('/staff/notifications')
      return
    }

    if (user.role === 'admin') {
      navigate('/admin/notifications')
      return
    }

    navigate('/client/activities')
  }

  return (
    <header className="zs-nav">
      <div className="zs-nav__inner">
        <Link to="/" className="zs-nav__brand">
          <img src={logo} alt="ZenStyle" className="zs-nav__logo" width={120} height={48} />
        </Link>

        <nav className="zs-nav__links" aria-label="Main">
          <Link to="/">Home</Link>
          <a href="/#products">Products</a>
          <a href="/#services">Services</a>
          <a href="/#promotions">Promotions</a>
          <a href="/#about">About</a>
          <a href="/#booking">Booking</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="zs-nav__actions">
          <Link to="/cart" className="zs-nav__icon-btn zs-nav__cart" aria-label={cartLabel}>
            <IconCart />
            {totalQuantity > 0 && <span className="zs-nav__badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>}
          </Link>
          <button type="button" className="zs-nav__icon-btn" aria-label="Notifications" onClick={handleNotifications}>
            <IconBell />
          </button>
          {user ? (
            <>
              <Link to={profilePath} className="zs-nav__icon-btn" aria-label="User profile">
                <IconUser />
              </Link>
              <Link to={dashboardPath} className="zs-nav__user">
                {user.name || 'User'}
              </Link>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="zs-btn zs-btn--gold zs-nav__login">
                Login
              </Link>
              <Link to="/register" className="zs-btn zs-btn--ghost zs-btn--sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
