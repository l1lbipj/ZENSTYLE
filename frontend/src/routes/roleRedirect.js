import { Roles } from './roleConfig'

export function getRoleRedirectPath(role) {
  switch (role) {
    case Roles.ADMIN:
      return '/admin'
    case Roles.STAFF:
      return '/staff'
    case Roles.CLIENT:
    default:
      return '/'
  }
}
