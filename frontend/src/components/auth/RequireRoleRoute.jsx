import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getAccessToken } from '../../utils/auth'

export default function RequireRoleRoute({ allow, children }) {
  const { user } = useAuth()
  const token = getAccessToken()

  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'staff') return <Navigate to="/staff" replace />
    return <Navigate to="/client" replace />
  }

  return children
}
