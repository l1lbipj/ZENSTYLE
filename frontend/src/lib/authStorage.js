import { STORAGE_KEYS } from '../constants'
import { isAllowedRole, Roles } from '../routes/roleConfig'

/**
 * Returns a minimal safe user object or null if stored JSON is invalid or tampered.
 */
export function parseStoredUser(raw) {
  if (!raw || typeof raw !== 'string') return null
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  // Support auth payload shape: { access_token, user_type, user: {...} }
  if (parsed.user && typeof parsed.user === 'object') {
    const nestedEmail = typeof parsed.user.email === 'string' ? parsed.user.email.trim() : ''
    if (!nestedEmail) return null
    const nestedRole = typeof parsed.user_type === 'string' ? parsed.user_type.trim() : ''
    const role = isAllowedRole(nestedRole) ? nestedRole : Roles.CLIENT
    const nestedName =
      typeof parsed.user.client_name === 'string'
        ? parsed.user.client_name.trim()
        : typeof parsed.user.staff_name === 'string'
          ? parsed.user.staff_name.trim()
          : typeof parsed.user.admin_name === 'string'
            ? parsed.user.admin_name.trim()
            : ''
    const name = nestedName || nestedEmail.split('@')[0] || 'User'
    const id = parsed.user.client_id ?? parsed.user.staff_id ?? parsed.user.admin_id ?? nestedEmail
    return { id, name, email: nestedEmail, role }
  }

  const email = typeof parsed.email === 'string' ? parsed.email.trim() : ''
  if (!email) return null
  const rawRole = typeof parsed.role === 'string' ? parsed.role.trim() : ''
  if (rawRole && !isAllowedRole(rawRole)) return null
  const role = isAllowedRole(rawRole) ? rawRole : Roles.CLIENT
  const name =
    typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : email.split('@')[0] || 'User'
  const id = parsed.id != null ? parsed.id : email
  return { id, name, email, role }
}

export function readAuthUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!raw) return null
    return parseStoredUser(raw)
  } catch {
    return null
  }
}

export function writeAuthUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    return
  }
  const email = typeof user.email === 'string' ? user.email.trim() : ''
  if (!email) {
    throw new Error('Invalid user payload')
  }
  const rawRole = typeof user.role === 'string' ? user.role.trim() : ''
  if (rawRole && !isAllowedRole(rawRole)) {
    throw new Error('Invalid user payload')
  }
  const role = isAllowedRole(rawRole) ? rawRole : Roles.CLIENT
  const name =
    typeof user.name === 'string' && user.name.trim() ? user.name.trim() : email.split('@')[0] || 'User'
  const id = user.id != null ? user.id : email
  const safe = { id, name, email, role }
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(safe))
}
