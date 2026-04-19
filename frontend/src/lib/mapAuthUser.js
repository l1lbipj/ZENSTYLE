import { normalizeRole } from '../routes/roleConfig'

/**
 * Maps API JSON (either `{ user: {...} }` or a flat user) to the client user shape.
 */
export function userFromAuthResponse(data, fallbackRole) {
  const raw = data?.user ?? data
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid server response')
  }
  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  if (!email) {
    throw new Error('Invalid server response')
  }
  const role = normalizeRole(typeof raw.role === 'string' ? raw.role : fallbackRole)
  const nameRaw = typeof raw.name === 'string' ? raw.name.trim() : ''
  const name = nameRaw || email.split('@')[0] || 'User'
  const id = raw.id != null ? raw.id : email
  return { id, name, email, role }
}
