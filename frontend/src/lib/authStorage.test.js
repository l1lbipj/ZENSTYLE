import { describe, expect, test, beforeEach, vi } from 'vitest'
import { parseStoredUser, writeAuthUser, readAuthUser } from './authStorage'
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

describe('authStorage', () => {
  test('parseStoredUser rejects tampered role', () => {
    const raw = JSON.stringify({ email: 'a@b.com', role: 'superuser', name: 'A' })
    expect(parseStoredUser(raw)).toBeNull()
  })

  test('parseStoredUser accepts valid payload', () => {
    const raw = JSON.stringify({ email: 'a@b.com', role: 'client', name: 'Ann' })
    expect(parseStoredUser(raw)).toEqual({
      id: 'a@b.com',
      name: 'Ann',
      email: 'a@b.com',
      role: 'client',
    })
  })

  test('writeAuthUser then readAuthUser roundtrip', () => {
    writeAuthUser({ id: 1, name: 'Ann', email: 'a@b.com', role: 'staff' })
    expect(readAuthUser()).toEqual({
      id: 1,
      name: 'Ann',
      email: 'a@b.com',
      role: 'staff',
    })
    expect(ls.getItem(STORAGE_KEYS.AUTH)).toContain('staff')
  })

  test('writeAuthUser throws on invalid role', () => {
    expect(() => writeAuthUser({ id: 1, name: 'X', email: 'x@y.com', role: 'hacker' })).toThrow()
  })
})
