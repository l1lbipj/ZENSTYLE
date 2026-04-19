import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Staff', to: '/admin/staff' },
  { label: 'Services', to: '/admin/services' },
  { label: 'Promotions', to: '/admin/promotions' },
  { label: 'Inventory', to: '/admin/inventory' },
  { label: 'Suppliers', to: '/admin/suppliers' },
  { label: 'Reports', to: '/admin/reports' },
]

export default function AdminLayout() {
  return (
    <AppShell title="Dashboard" badgeLabel="Admin" navItems={navItems}>
      <Outlet />
    </AppShell>
  )
}
