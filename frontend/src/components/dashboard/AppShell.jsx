import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import Button from '../ui/Button'
import logo from '../../assets/logo.png'

export default function AppShell({ title, navItems, children, welcome, badgeLabel }) {
  const { user, logout } = useAuth()

  return (
    <div className="zs-shell">
      <aside className="zs-shell__nav">
        <div className="zs-shell__brand">
          <img src={logo} alt="ZenStyle" />
          <span>ZenStyle</span>
          <small>Salon & Wellness</small>
        </div>
        <nav className="zs-shell__menu">
          {user?.role === 'client' && (
            <NavLink to="/" end className="zs-shell__link">
              Home
            </NavLink>
          )}
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end className="zs-shell__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="zs-shell__user">
          <div className="zs-shell__user-card">
            <div className="zs-shell__avatar" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M20 21a8 8 0 1 0-16 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <div>
              <span>{user?.name || 'User'}</span>
              <small>{user?.role}</small>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="zs-shell__logout">
            Logout
          </Button>
        </div>
      </aside>
      <div className="zs-shell__content">
        <header className="zs-shell__header">
          <div>
            <p className="zs-shell__welcome">{welcome || 'Welcome, ZenStyle Team'}</p>
            <h1>{title || 'Dashboard'}</h1>
          </div>
          <span className="zs-shell__badge">{badgeLabel || title}</span>
        </header>
        <main className="zs-shell__main">{children}</main>
      </div>
    </div>
  )
}
