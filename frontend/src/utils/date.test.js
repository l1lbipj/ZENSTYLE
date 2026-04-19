import { describe, expect, test, vi, afterEach } from 'vitest'
import { getLocalDateString } from './date'

describe('getLocalDateString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('formats local calendar date as YYYY-MM-DD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0, 0))
    expect(getLocalDateString()).toBe('2026-04-05')
  })

  test('pads month and day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 7, 8, 0, 0))
    expect(getLocalDateString()).toBe('2026-01-07')
  })
})
