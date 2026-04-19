import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navItems = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Book Appointment', to: '/client/book' },
  { label: 'My Appointments', to: '/client/appointments' },
  { label: 'Service History', to: '/client/history' },
  { label: 'Rewards', to: '/client/rewards' },
  { label: 'Feedback', to: '/client/feedback' },
  { label: 'Products', to: '/products' },
  { label: 'Profile', to: '/client/profile' },
]

export default function ClientLayout() {
  return (
    <AppShell title="Dashboard" badgeLabel="Client" navItems={navItems}>
      <Outlet />
    </AppShell>
  )
}
