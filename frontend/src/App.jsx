
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'
import './styles/app-shell.css'

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import StaffManagementPage from './pages/admin/StaffManagementPage'
import ServiceManagementPage from './pages/admin/ServiceManagementPage'
import PromotionManagementPage from './pages/admin/PromotionManagementPage'
import InventoryManagementPage from './pages/admin/InventoryManagementPage'
import SupplierManagementPage from './pages/admin/SupplierManagementPage'
import ReportsPage from './pages/admin/ReportsPage'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffTasksPage from './pages/staff/StaffTasksPage'
import StaffSchedulePage from './pages/staff/StaffSchedulePage'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import BookAppointmentPage from './pages/client/BookAppointmentPage'
import ClientAppointmentsPage from './pages/client/ClientAppointmentsPage'
import ServiceHistoryPage from './pages/client/ServiceHistoryPage'
import RewardsPage from './pages/client/RewardsPage'
import FeedbackPage from './pages/client/FeedbackPage'
import ClientProfilePage from './pages/client/ClientProfilePage'

// Shop pages
import ProductListPage from './pages/shop/ProductListPage'
import ProductDetailPage from './pages/shop/ProductDetailPage'
import CartPage from './pages/shop/CartPage'
import ServiceDetailPage from './pages/service/ServiceDetailPage'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import StaffLayout from './layouts/StaffLayout'
import ClientLayout from './layouts/ClientLayout'
import AuthLayout from './layouts/AuthLayout'
import RequireRoleRoute from './components/auth/RequireRoleRoute'
import RequireAuth from './routes/RequireAuth'
import NotificationsPage from './pages/notifications/NotificationsPage'
import UserProfilePage from './pages/UserProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
        </Route>

        {/* Auth layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Authenticated routes (any role) */}
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>

        {/* Admin layout */}
        <Route path="/admin" element={<RequireRoleRoute allow={['admin']}><AdminLayout /></RequireRoleRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="promotions" element={<PromotionManagementPage />} />
          <Route path="inventory" element={<InventoryManagementPage />} />
          <Route path="suppliers" element={<SupplierManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Staff layout */}
        <Route path="/staff" element={<RequireRoleRoute allow={['staff']}><StaffLayout /></RequireRoleRoute>}>
          <Route index element={<StaffDashboard />} />
          <Route path="tasks" element={<StaffTasksPage />} />
          <Route path="schedule" element={<StaffSchedulePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Client layout */}
        <Route path="/client" element={<RequireRoleRoute allow={['client']}><ClientLayout /></RequireRoleRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="book" element={<BookAppointmentPage />} />
          <Route path="appointments" element={<ClientAppointmentsPage />} />
          <Route path="history" element={<ServiceHistoryPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="profile" element={<ClientProfilePage />} />
        </Route>

        {/* Not found fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
