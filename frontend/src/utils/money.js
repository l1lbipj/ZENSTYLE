function readVndPerUsd() {
  const raw = import.meta?.env?.VITE_VND_PER_USD
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25000
}

export function convertVNDToUSD(vnd) {
  const n = Number(vnd)
  if (!Number.isFinite(n)) return NaN

  // Heuristic: if backend values are already in "USD-like" units (e.g. 35.00),
  // converting by VND/USD would incorrectly produce $0.00. Treat small numbers
  // as USD already.
  if (n !== 0 && Math.abs(n) < 1000) {
    return n
  }

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

