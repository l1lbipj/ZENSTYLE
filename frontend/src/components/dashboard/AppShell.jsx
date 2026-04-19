import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import Button from '../ui/Button'
import logo from '../../assets/logo.png'

function DefaultUserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V21h13V9.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 12v8H4v-8M21 7h-18v5h18V7ZM12 20V7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7H8.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h3.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 21a8 8 0 1 0-16 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const iconMap = {
  home: <HomeIcon />,
  calendar: <CalendarIcon />,
  gift: <GiftIcon />,
  user: <UserCardIcon />,
  chat: <ChatIcon />,
}

function normalizeSections(user, navItems, navSections) {
  if (Array.isArray(navSections) && navSections.length > 0) return navSections

  const items = []
  if (user?.role === 'client') {
    items.push({ label: 'Home', to: '/', icon: 'home' })
  }
  items.push(...(navItems || []))
  return [{ title: null, items }]
}

export default function AppShell({ title, navItems, navSections, children, welcome, badgeLabel, variant = 'default' }) {
  const { user, logout } = useAuth()
  const sections = normalizeSections(user, navItems, navSections)

  return (
    <div className={`zs-shell ${variant === 'client' ? 'zs-shell--client' : ''}`}>
      <aside className="zs-shell__nav">
        <div className="zs-shell__brand">
          <img src={logo} alt="ZenStyle" />
          <span>ZenStyle</span>
          <small>{variant === 'client' ? 'Client account area' : 'Salon & Wellness'}</small>
        </div>
        <div className="zs-shell__nav-groups">
          {sections.map((section, index) => (
            <div key={section.title || `section-${index}`} className="zs-shell__group">
              {section.title ? <p className="zs-shell__group-title">{section.title}</p> : null}
              <nav className="zs-shell__menu">
                {section.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end className="zs-shell__link">
                    <span className="zs-shell__link-icon">{iconMap[item.icon] || <DefaultUserIcon />}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="zs-shell__user">
          <div className="zs-shell__user-card">
            <div className="zs-shell__avatar" aria-hidden>
              <DefaultUserIcon />
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
