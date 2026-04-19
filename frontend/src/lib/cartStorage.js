import { STORAGE_KEYS } from '../constants'

const MAX_QTY_PER_LINE = 999
const MAX_LINE_ITEMS = 50

export function clampCartQty(value) {
  const n = Number.isFinite(value) ? Math.trunc(value) : 1
  return Math.min(MAX_QTY_PER_LINE, Math.max(1, n))
}

function normalizeLineItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id ?? '').trim()
  if (!id) return null
  const name = String(raw.name ?? id).trim().slice(0, 240) || id
  const price = Number(raw.price)
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return null
  const qty = clampCartQty(raw.qty)
  const image = typeof raw.image === 'string' ? raw.image.trim().slice(0, 2048) : ''
  return { id, name, price, qty, image }
}

export function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeLineItem).filter(Boolean).slice(0, MAX_LINE_ITEMS)
  } catch {
    return []
  }
}

export function writeCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.CART)
    return
  }
  const safe = items.map(normalizeLineItem).filter(Boolean).slice(0, MAX_LINE_ITEMS)
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(safe))
}
