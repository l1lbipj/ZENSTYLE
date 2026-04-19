import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getRoleRedirectPath } from '../routes/roleRedirect'
import '../styles/auth.css'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="zs-auth-layout">
        <div className="zs-page-state" role="status" aria-busy="true">
          Loading...
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.role === 'client' ? '/' : getRoleRedirectPath(user.role)} replace />
  }

  return (
    <div className="zs-auth-layout">
      <Outlet />
    </div>
  )
}
