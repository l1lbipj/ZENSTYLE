import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/staff', icon: 'home' },
      { label: 'My profile', to: '/profile', icon: 'user' },
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
      { label: 'Feedbacks', to: '/staff/feedbacks', icon: 'chat' },
    ],
  },
]

export default function StaffLayout() {
  return (
    <AppShell
      title="Staff Account Area"
      badgeLabel="Staff"
      navSections={navSections}
      welcome="Welcome to your staff account area"
      variant="staff"
    >
      <Outlet />
    </AppShell>
  )
}
