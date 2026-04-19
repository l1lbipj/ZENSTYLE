import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const staffNav = [
  { label: 'Dashboard', to: '/staff' },
  { label: 'My Schedule', to: '/staff/schedule' },
  { label: 'Assigned Tasks', to: '/staff/tasks' },
]

export default function StaffLayout() {
  return (
    <AppShell title="Dashboard" badgeLabel="Staff" navItems={staffNav}>
      <Outlet />
    </AppShell>
  )
}
