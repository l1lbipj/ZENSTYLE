import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import AuthLayout from '../layouts/AuthLayout'
import ClientLayout from '../layouts/ClientLayout'
import StaffLayout from '../layouts/StaffLayout'
import AdminLayout from '../layouts/AdminLayout'
import RequireAuth from './RequireAuth'
import RequireRole from './RequireRole'
import { Roles } from './roleConfig'

// Lazy load pages for better performance
const HomePage = lazy(() => import('../pages/HomePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const OtpPage = lazy(() => import('../pages/auth/OtpPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const UnauthorizedPage = lazy(() => import('../pages/auth/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const ClientDashboard = lazy(() => import('../pages/client/ClientDashboard'))
const BookAppointmentPage = lazy(() => import('../pages/client/BookAppointmentPage'))
const ClientAppointmentsPage = lazy(() => import('../pages/client/ClientAppointmentsPage'))
const UnifiedActivityPage = lazy(() => import('../pages/client/UnifiedActivityPage'))
const ServiceHistoryPage = lazy(() => import('../pages/client/ServiceHistoryPage'))
const RewardsPage = lazy(() => import('../pages/client/RewardsPage'))
const FeedbackPage = lazy(() => import('../pages/client/FeedbackPage'))
const ClientProfilePage = lazy(() => import('../pages/client/ClientProfilePage'))
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'))
const StaffDashboard = lazy(() => import('../pages/staff/StaffDashboard'))
const StaffSchedulePage = lazy(() => import('../pages/staff/StaffSchedulePage'))
const StaffTasksPage = lazy(() => import('../pages/staff/StaffTasksPage'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const StaffManagementPage = lazy(() => import('../pages/admin/StaffManagementPage'))
const ServiceManagementPage = lazy(() => import('../pages/admin/ServiceManagementPage'))
const PromotionManagementPage = lazy(() => import('../pages/admin/PromotionManagementPage'))
const InventoryManagementPage = lazy(() => import('../pages/admin/InventoryManagementPage'))
const SupplierManagementPage = lazy(() => import('../pages/admin/SupplierManagementPage'))
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage'))
const ProductListPage = lazy(() => import('../pages/shop/ProductListPage'))
const ProductDetailPage = lazy(() => import('../pages/shop/ProductDetailPage'))
const CartPage = lazy(() => import('../pages/shop/CartPage'))
const ServiceDetailPage = lazy(() => import('../pages/service/ServiceDetailPage'))
const UserProfilePage = lazy(() => import('../pages/UserProfilePage'))

function LoadingFallback() {
  return (
    <div className="zs-page-state" role="status" aria-busy="true" aria-live="polite">
      Loading…
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<PublicLayout />}>
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="otp" element={<OtpPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="profile" element={<UserProfilePage />} />
          <Route
            path="client"
            element={
              <RequireRole roles={[Roles.CLIENT]}>
                <ClientLayout />
              </RequireRole>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="book" element={<BookAppointmentPage />} />
            <Route path="appointments" element={<ClientAppointmentsPage />} />
            <Route path="activities" element={<UnifiedActivityPage />} />
            <Route path="history" element={<ServiceHistoryPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
          </Route>

          <Route
            path="staff"
            element={
              <RequireRole roles={[Roles.STAFF]}>
                <StaffLayout />
              </RequireRole>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="schedule" element={<StaffSchedulePage />} />
            <Route path="tasks" element={<StaffTasksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route
            path="admin"
            element={
              <RequireRole roles={[Roles.ADMIN]}>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="services" element={<ServiceManagementPage />} />
            <Route path="promotions" element={<PromotionManagementPage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="suppliers" element={<SupplierManagementPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
