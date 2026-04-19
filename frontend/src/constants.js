// Constants for the application
export const STAFF_OPTIONS = [
  { value: 'any', label: 'Any available' },
  { value: 'minh', label: 'Minh Nguyen' },
  { value: 'linh', label: 'Linh Pham' },
]

export const SERVICE_OPTIONS = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'color', label: 'Color' },
  { value: 'spa', label: 'Spa Treatment' },
]

/** @deprecated Use Roles from routes/roleConfig */
export { Roles as USER_ROLES } from './routes/roleConfig'

export const STORAGE_KEYS = {
  AUTH: 'zs_auth',
  CART: 'zs_cart',
  /** Applied cart promo code (sessionStorage, per browser tab) */
  CART_PROMO_SESSION: 'zs_cart_applied_promo',
}

/** Promo codes for cart (value matches stored selection). */
export const CART_PROMO = {
  NONE: 'none',
  ZEN10: 'zen10',
  ZEN20: 'zen20',
}

export function getCartPromoDiscountRate(code) {
  if (code === CART_PROMO.ZEN10) return 0.1
  if (code === CART_PROMO.ZEN20) return 0.2
  return 0
}