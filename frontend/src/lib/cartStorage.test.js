import { describe, expect, test, beforeEach, vi } from 'vitest'
import { clampCartQty, readCart, writeCart } from './cartStorage'
import { STORAGE_KEYS } from '../constants'

const ls = (() => {
  let store = {}
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => {
      store[k] = v
    },
    removeItem: (k) => {
      delete store[k]
    },
    _clear: () => {
      store = {}
    },
  }
})()

beforeEach(() => {
  ls._clear()
  vi.stubGlobal('localStorage', ls)
})

describe('cartStorage', () => {
  test('clampCartQty bounds', () => {
    expect(clampCartQty(0)).toBe(1)
    expect(clampCartQty(1.9)).toBe(1)
    expect(clampCartQty(1000)).toBe(999)
    expect(clampCartQty(NaN)).toBe(1)
  })

  test('writeCart empty removes key', () => {
    writeCart([])
    expect(ls.getItem(STORAGE_KEYS.CART)).toBeNull()
  })

  test('readCart drops invalid lines', () => {
    ls.setItem(STORAGE_KEYS.CART, JSON.stringify([{ id: 'a', name: 'A', price: 10, qty: 1 }, { id: '', price: 1 }]))
    expect(readCart()).toHaveLength(1)
    expect(readCart()[0].id).toBe('a')
  })
})
