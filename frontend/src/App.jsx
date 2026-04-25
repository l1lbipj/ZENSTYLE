
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
import AdminProductsPage from './pages/admin/AdminProductsPage'
import CategoryManagementPage from './pages/admin/CategoryManagementPage'
import ServiceManagementPage from './pages/admin/ServiceManagementPage'
import PromotionManagementPage from './pages/admin/PromotionManagementPage'
import SupplierManagementPage from './pages/admin/SupplierManagementPage'
import ReportsPage from './pages/admin/ReportsPage'
import FeedbackManagementPage from './pages/admin/FeedbackManagementPage'
import AdminProfilePage from './pages/admin/AdminProfilePage'
import PerformancePage from './pages/admin/PerformancePage'
import AllergyManagementPage from './pages/admin/AllergyManagementPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffTasksPage from './pages/staff/StaffTasksPage'
import StaffSchedulePage from './pages/staff/StaffSchedulePage'
import StaffFeedbackPage from './pages/staff/StaffFeedbackPage'
import StaffProfilePage from './pages/staff/StaffProfilePage'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import BookAppointmentPage from './pages/client/BookAppointmentPage'
import ClientAppointmentsPage from './pages/client/ClientAppointmentsPage'
import MyOrdersPage from './pages/client/MyOrdersPage'
import ServiceHistoryPage from './pages/client/ServiceHistoryPage'
import FeedbackPage from './pages/client/FeedbackPage'
import ClientProfilePage from './pages/client/ClientProfilePage'
import UnifiedActivityPage from './pages/client/UnifiedActivityPage'

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
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="allergies" element={<AllergyManagementPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="product-categories" element={<CategoryManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="promotions" element={<PromotionManagementPage />} />
          <Route path="suppliers" element={<SupplierManagementPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="feedbacks" element={<FeedbackManagementPage />} />
        </Route>

        {/* Staff layout */}
        <Route path="/staff" element={<RequireRoleRoute allow={['staff']}><StaffLayout /></RequireRoleRoute>}>
          <Route index element={<StaffDashboard />} />
          <Route path="profile" element={<StaffProfilePage />} />
          <Route path="tasks" element={<StaffTasksPage />} />
          <Route path="schedule" element={<StaffSchedulePage />} />
          <Route path="feedbacks" element={<StaffFeedbackPage />} />
        </Route>

        {/* Client layout */}
        <Route path="/client" element={<RequireRoleRoute allow={['client']}><ClientLayout /></RequireRoleRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="book" element={<BookAppointmentPage />} />
          <Route path="activities" element={<UnifiedActivityPage />} />
          <Route path="appointments" element={<ClientAppointmentsPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="history" element={<ServiceHistoryPage />} />
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
