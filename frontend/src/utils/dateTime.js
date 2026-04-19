import dayjs from 'dayjs'

export function formatDate(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MMMM D, YYYY') : '—'
}

export function formatDateWithWeekday(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY') : '—'
}

export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MMMM D, YYYY - hh:mm A') : '—'
}

export function formatTime(value) {
  if (!value) return '—'
  const normalized = typeof value === 'string' && value.length <= 5 ? `${value}:00` : value
  const parsed = dayjs(`2026-01-01 ${normalized}`)
  return parsed.isValid() ? parsed.format('hh:mm A') : '—'
}
