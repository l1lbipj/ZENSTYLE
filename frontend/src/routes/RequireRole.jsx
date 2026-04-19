import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getRoleRedirectPath } from './roleRedirect'

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="zs-page-state" role="status" aria-busy="true">Loading…</div>
  }

  if (!user) {
    return null
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />
  }

  return children
}
