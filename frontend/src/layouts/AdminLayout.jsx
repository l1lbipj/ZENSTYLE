import { Outlet } from 'react-router-dom'
import AppShell from '../components/dashboard/AppShell'

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: 'home' },
      { label: 'My profile', to: '/profile', icon: 'user' },
    ],
  },
  {
      title: 'Management',
      items: [
        { label: 'Appointments', to: '/admin/appointments', icon: 'calendar' },
        { label: 'Staff', to: '/admin/staff', icon: 'user' },
        { label: 'Allergies', to: '/admin/allergies', icon: 'settings' },
        { label: 'Products', to: '/admin/products', icon: 'settings' },
        { label: 'Categories', to: '/admin/categories', icon: 'settings' },
        { label: 'Orders', to: '/admin/orders', icon: 'cart' },
        { label: 'Services', to: '/admin/services', icon: 'settings' },
        { label: 'Promotions', to: '/admin/promotions', icon: 'gift' },
        { label: 'Suppliers', to: '/admin/suppliers', icon: 'truck' },
        { label: 'Feedbacks', to: '/admin/feedbacks', icon: 'chat' },
      ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Performance', to: '/admin/performance', icon: 'chart' },
      { label: 'Reports', to: '/admin/reports', icon: 'chart' },
    ],
  },
]

export default function AdminLayout() {
  return (
    <AppShell
      title="Admin Account Area"
      badgeLabel="Admin"
      navSections={navSections}
      welcome="Welcome to your admin account area"
      variant="admin"
    >
      <Outlet />
    </AppShell>
  )
}
