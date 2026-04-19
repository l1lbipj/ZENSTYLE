export const Roles = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CLIENT: 'client',
}

const ALL_ROLES = [Roles.ADMIN, Roles.STAFF, Roles.CLIENT]

export function isAllowedRole(role) {
  return typeof role === 'string' && ALL_ROLES.includes(role)
}

export function normalizeRole(role, fallback = Roles.CLIENT) {
  if (isAllowedRole(role)) return role
  return fallback
}

export const roleLabels = {
  [Roles.ADMIN]: 'Admin',
  [Roles.STAFF]: 'Staff',
  [Roles.CLIENT]: 'Client',
}

export const roleOptions = [...ALL_ROLES]
