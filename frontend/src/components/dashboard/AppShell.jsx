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

function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M12.89 1.45l8 4A2 2 0 0 1 21 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.32 6.16l9.36 4.46a1 1 0 0 0 .9 0l9.37-4.46" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="1" x2="12" y2="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 18H9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <line x1="12" y1="20" x2="12" y2="10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="20" x2="18" y2="4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="20" x2="6" y2="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="17" x2="8" y2="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10,9 9,10 8,9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const iconMap = {
  home: <HomeIcon />,
  calendar: <CalendarIcon />,
  gift: <GiftIcon />,
  user: <UserCardIcon />,
  chat: <ChatIcon />,
  box: <BoxIcon />,
  truck: <TruckIcon />,
  chart: <BarChartIcon />,
  settings: <SettingsIcon />,
  task: <TaskIcon />,
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
    <div className={`zs-shell ${variant === 'client' ? 'zs-shell--client' : variant === 'admin' ? 'zs-shell--admin' : variant === 'staff' ? 'zs-shell--staff' : ''}`}>
      <aside className="zs-shell__nav">
        <div className="zs-shell__brand">
          <img src={logo} alt="ZenStyle" />
          <span>ZenStyle</span>
          <small>{variant === 'client' ? 'Client account area' : variant === 'admin' ? 'Admin account area' : variant === 'staff' ? 'Staff account area' : 'Salon & Wellness'}</small>
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
