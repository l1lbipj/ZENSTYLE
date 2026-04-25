import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/useAuth'
import { useCart } from '../../context/useCart'
import { getRoleRedirectPath } from '../../routes/roleRedirect'
import businessApi from '../../Api/businessApi'

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

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { totalQuantity } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const panelRef = useRef(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

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
  const showNotifications = user?.role === 'client' && location.pathname === '/'

  const loadNotifications = useCallback(async () => {
    if (!showNotifications) return
    setNotificationsLoading(true)
    try {
      const res = await businessApi.clientNotifications()
      const payload = res?.data?.data || {}
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : [])
      setUnreadCount(Number(payload.unread_count || 0))
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }, [showNotifications])

  useEffect(() => {
    if (!showNotifications) {
      setNotificationsOpen(false)
      setNotifications([])
      setUnreadCount(0)
      return
    }

    loadNotifications()
  }, [showNotifications, user?.id, loadNotifications])

  useEffect(() => {
    if (!showNotifications) return undefined

    const intervalId = window.setInterval(() => {
      loadNotifications()
    }, 5 * 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [showNotifications, loadNotifications])

  useEffect(() => {
    if (!notificationsOpen) return undefined

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationsOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const handleNotifications = async () => {
    if (!showNotifications) return
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    if (nextOpen) {
      await loadNotifications()
    }
  }

  const markNotificationRead = async (notificationId) => {
    try {
      await businessApi.markClientNotificationRead(notificationId)
      await loadNotifications()
    } catch {
      /* keep the UI quiet; it will refresh on next open */
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
          <a href="/#products">Products</a>
          <a href="/#services">Services</a>
          <a href="/#promotions">Promotions</a>
          <a href="/#about">About</a>
          <a href="/#booking">Booking</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="zs-nav__actions" ref={panelRef}>
          <Link to="/cart" className="zs-nav__icon-btn zs-nav__cart" aria-label={cartLabel}>
            <IconCart />
            {totalQuantity > 0 && <span className="zs-nav__badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>}
          </Link>
          {showNotifications ? (
            <div className="zs-nav__notifications">
              <button
                type="button"
                className="zs-nav__icon-btn zs-nav__icon-btn--notifications"
                aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                onClick={handleNotifications}
              >
                <IconBell />
                {unreadCount > 0 ? <span className="zs-nav__dot" aria-hidden="true" /> : null}
              </button>
              {notificationsOpen ? (
                <div className="zs-nav__panel" role="menu" aria-label="Notifications">
                  <div className="zs-nav__panel-head">
                    <strong>Notifications</strong>
                    <span>{unreadCount > 0 ? `${unreadCount} unread` : 'All read'}</span>
                  </div>
                  <div className="zs-nav__panel-body">
                    {notificationsLoading ? (
                      <p className="zs-nav__panel-empty">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                      <p className="zs-nav__panel-empty">No notifications yet.</p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`zs-nav__notification ${notification.is_read ? '' : 'is-unread'}`.trim()}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <span className="zs-nav__notification-title">{notification.title}</span>
                          <span className="zs-nav__notification-message">{notification.short_message || notification.message}</span>
                          <span className="zs-nav__notification-time">{formatNotificationTime(notification.created_at)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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
