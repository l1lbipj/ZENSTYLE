function readVndPerUsd() {
  return 1
}

export function convertVNDToUSD(vnd) {
  const n = Number(vnd)
  if (!Number.isFinite(n)) return NaN
  return n / readVndPerUsd()
}

export function formatUSD(value, options = {}) {
  const { from = 'USD', maximumFractionDigits = 2, minimumFractionDigits = 2 } = options

  const base = Number(value)
  if (!Number.isFinite(base)) return '—'

  const usd = from === 'VND' ? convertVNDToUSD(base) : base
  if (!Number.isFinite(usd)) return '—'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(usd)
}

