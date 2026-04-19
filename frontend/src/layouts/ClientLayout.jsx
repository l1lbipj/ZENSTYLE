import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navSections = [
  {
    title: 'Account',
    items: [
      { label: 'Home', to: '/', icon: 'home' },
      { label: 'My account', to: '/client/profile', icon: 'user' },
      { label: 'Overview', to: '/client', icon: 'user' },
    ],
  },
  {
    title: 'Appointments',
    items: [
      { label: 'Book appointment', to: '/client/book', icon: 'calendar' },
      { label: 'My appointments', to: '/client/appointments', icon: 'calendar' },
      { label: 'Service history', to: '/client/history', icon: 'calendar' },
    ],
  },
  {
    title: 'Benefits',
    items: [
      { label: 'Rewards', to: '/client/rewards', icon: 'gift' },
      { label: 'Feedback', to: '/client/feedback', icon: 'chat' },
      { label: 'Products', to: '/products', icon: 'gift' },
    ],
  },
]

export default function ClientLayout() {
  return (
    <AppShell
      title="Client account"
      welcome="Your personal ZenStyle area"
      badgeLabel="Customer"
      navSections={navSections}
      variant="client"
    >
      <Outlet />
    </AppShell>
  )
}
