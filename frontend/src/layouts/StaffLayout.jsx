import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/staff', icon: 'home' },
    ],
  },
  {
    title: 'Schedule',
    items: [
      { label: 'Work Schedule', to: '/staff/schedule', icon: 'calendar' },
    ],
  },
  {
    title: 'Tasks',
    items: [
      { label: 'Assigned Tasks', to: '/staff/tasks', icon: 'task' },
    ],
  },
]

export default function StaffLayout() {
  return (
    <AppShell
      title="Staff Dashboard"
      badgeLabel="Staff"
      navSections={navSections}
      welcome="Welcome to the staff area"
      variant="staff"
    >
      <Outlet />
    </AppShell>
  )
}
