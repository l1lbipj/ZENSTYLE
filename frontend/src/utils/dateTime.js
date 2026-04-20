import dayjs from 'dayjs'

const EMPTY_VALUE = '--'

export function formatDate(value) {
  if (!value) return EMPTY_VALUE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MMMM D, YYYY') : EMPTY_VALUE
}

export function formatDateWithWeekday(value) {
  if (!value) return EMPTY_VALUE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY') : EMPTY_VALUE
}

export function formatDateTime(value) {
  if (!value) return EMPTY_VALUE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MMMM D, YYYY - hh:mm A') : EMPTY_VALUE
}

export function formatFullDateTime(value) {
  if (!value) return EMPTY_VALUE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY - hh:mm A') : EMPTY_VALUE
}

export function formatTime(value) {
  if (!value) return EMPTY_VALUE
  const normalized = typeof value === 'string' && value.length <= 5 ? `${value}:00` : value
  const parsed = dayjs(`2026-01-01 ${normalized}`)
  return parsed.isValid() ? parsed.format('hh:mm A') : EMPTY_VALUE
}
