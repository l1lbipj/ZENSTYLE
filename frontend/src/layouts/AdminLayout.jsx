import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: 'home' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Staff', to: '/admin/staff', icon: 'user' },
      { label: 'Services', to: '/admin/services', icon: 'settings' },
      { label: 'Promotions', to: '/admin/promotions', icon: 'gift' },
      { label: 'Inventory', to: '/admin/inventory', icon: 'box' },
      { label: 'Suppliers', to: '/admin/suppliers', icon: 'truck' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Reports', to: '/admin/reports', icon: 'chart' },
    ],
  },
]

export default function AdminLayout() {
  return (
    <AppShell
      title="Admin Dashboard"
      badgeLabel="Admin"
      navSections={navSections}
      welcome="Welcome to the admin area"
      variant="admin"
    >
      <Outlet />
    </AppShell>
  )
}
