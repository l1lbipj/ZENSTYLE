import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import businessApi from '../../Api/businessApi'
import Card from '../ui/Card'
import { formatUSD } from '../../utils/money'

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function quickPresetRange(preset) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (preset === 'today') {
    return { from: localDateString(now), to: localDateString(now), group: 'hour' }
  }

  if (preset === 'this_week' || preset === 'last_7_days') {
    const from = new Date(today)
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7))
    const to = new Date(from)
    to.setDate(from.getDate() + 6)
    return { from: localDateString(from), to: localDateString(to), group: 'day' }
  }

  if (preset === 'this_year') {
    return {
      from: localDateString(new Date(now.getFullYear(), 0, 1)),
      to: localDateString(new Date(now.getFullYear(), 11, 31)),
      group: 'month',
    }
  }

  return {
    from: localDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    group: 'day',
  }
}

function customRangeDefaults() {
  const now = new Date()
  return {
    from: localDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDateString(now),
    group: 'day',
  }
}

function compactUSD(value) {
  const num = Number(value || 0)
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}k`
  return `$${num.toFixed(0)}`
}

function suggestCustomGroup(fromDate, toDate) {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1)

  if (days <= 7) return 'day'
  if (days <= 60) return 'week'
  return 'month'
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid rgba(201,168,79,0.35)',
        borderRadius: 12,
        padding: '10px 12px',
        boxShadow: '0 18px 36px rgba(61,47,27,0.12)',
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        <div>
          Total: <strong>{compactUSD(row?.total_revenue)}</strong>
        </div>
        <div>
          Appointments: <strong>{compactUSD(row?.appointment_revenue)}</strong>
        </div>
        <div>
          Shop: <strong>{compactUSD(row?.shop_revenue)}</strong>
        </div>
      </div>
    </div>
  )
}

export default function RevenueAnalyticsCard() {
  const customInitial = useMemo(() => customRangeDefaults(), [])

  const [mode, setMode] = useState('quick')
  const [preset, setPreset] = useState('this_month')
  const [groupBy, setGroupBy] = useState(quickPresetRange('this_month').group)
  const [fromDate, setFromDate] = useState(customInitial.from)
  const [toDate, setToDate] = useState(customInitial.to)
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hideZeros, setHideZeros] = useState(true)

  const loadRevenue = ({ nextMode = mode, nextPreset = preset, nextFrom = fromDate, nextTo = toDate, nextGroup = groupBy } = {}) => {
    const params =
      nextMode === 'custom'
        ? {
            mode: 'custom',
            from_date: nextFrom,
            to_date: nextTo,
            group_by: nextGroup,
          }
        : {
            mode: 'quick',
            preset: nextPreset,
            group_by: nextGroup,
          }

    setLoading(true)
    setError('')
    businessApi
      .adminRevenue(params)
      .then((res) => setPayload(res?.data?.data || null))
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load revenue analytics.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRevenue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = payload?.summary || {}
  const rangeText = `${payload?.from || fromDate || '--'} -> ${payload?.to || toDate || '--'}`

  const rows = useMemo(() => {
    const base = Array.isArray(payload?.trend) ? payload.trend : []
    const filtered = hideZeros ? base.filter((row) => Number(row.total_revenue || 0) > 0) : base
    return filtered.map((row) => ({ ...row, x: row.label }))
  }, [payload, hideZeros])

  const activateQuickPreset = (nextPreset) => {
    const next = quickPresetRange(nextPreset)
    setMode('quick')
    setPreset(nextPreset)
    setGroupBy(next.group)
    setError('')
    loadRevenue({ nextMode: 'quick', nextPreset, nextGroup: next.group })
  }

  const activateMode = (nextMode) => {
    if (nextMode === mode) return

    if (nextMode === 'quick') {
      setMode('quick')
      setPreset('this_month')
      setFromDate(customInitial.from)
      setToDate(customInitial.to)
      const next = quickPresetRange('this_month')
      setGroupBy(next.group)
      loadRevenue({ nextMode: 'quick', nextPreset: 'this_month', nextGroup: next.group })
      return
    }

    const next = customRangeDefaults()
    const suggestedGroup = suggestCustomGroup(next.from, next.to)
    setMode('custom')
    setPreset('this_month')
    setFromDate(next.from)
    setToDate(next.to)
    setGroupBy(suggestedGroup)
    loadRevenue({ nextMode: 'custom', nextFrom: next.from, nextTo: next.to, nextGroup: suggestedGroup })
  }

  const activateGroup = (nextGroup) => {
    setGroupBy(nextGroup)
    if (mode === 'custom') {
      loadRevenue({ nextMode: 'custom', nextFrom: fromDate, nextTo: toDate, nextGroup })
    }
  }

  const applyCustomRange = () => {
    const nextGroup = ['day', 'week', 'month'].includes(groupBy) ? groupBy : suggestCustomGroup(fromDate, toDate)
    if (!['day', 'week', 'month'].includes(groupBy)) {
      setGroupBy(nextGroup)
    }
    loadRevenue({
      nextMode: 'custom',
      nextFrom: fromDate,
      nextTo: toDate,
      nextGroup,
    })
  }

  const groupOptions = ['day', 'week', 'month']

  return (
    <Card
      title="Revenue analytics"
      description="Choose one mode at a time to keep revenue filtering simple and clear."
    >
      <div className="zs-filter-modebar">
        <div className="zs-toolbar__filters" aria-label="Revenue filter mode">
          <button
            type="button"
            className={`zs-chip ${mode === 'quick' ? 'is-active' : ''}`}
            aria-pressed={mode === 'quick'}
            onClick={() => activateMode('quick')}
          >
            Quick Filter
          </button>
          <button
            type="button"
            className={`zs-chip ${mode === 'custom' ? 'is-active' : ''}`}
            aria-pressed={mode === 'custom'}
            onClick={() => activateMode('custom')}
          >
            Custom Range
          </button>
        </div>

        {mode === 'custom' ? (
          <div className="zs-toolbar__filters" aria-label="Revenue group by">
            {groupOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`zs-chip ${groupBy === item ? 'is-active' : ''}`}
                aria-pressed={groupBy === item}
                onClick={() => activateGroup(item)}
              >
                {item === 'day' ? 'Day' : item === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {mode === 'quick' ? (
        <div className="zs-action-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {['today', 'this_week', 'this_month', 'this_year'].map((item) => (
            <button
              key={item}
              type="button"
              className={`zs-chip ${preset === item ? 'is-active' : ''}`}
              aria-pressed={preset === item}
              onClick={() => activateQuickPreset(item)}
            >
              {item === 'today' ? 'Today' : item === 'this_week' ? 'This Week' : item === 'this_month' ? 'This Month' : 'This Year'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: '#6b726c', fontSize: 13 }}>
            Range: <strong>{rangeText}</strong>
          </span>
        </div>
      ) : (
        <div className="zs-action-row" style={{ marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="zs-input"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            className="zs-input"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <button className="zs-btn zs-btn--secondary zs-btn--sm" type="button" onClick={applyCustomRange} disabled={loading}>
            {loading ? 'Loading...' : 'Apply'}
          </button>
          <span style={{ marginLeft: 'auto', color: '#6b726c', fontSize: 13 }}>
            Range: <strong>{rangeText}</strong>
          </span>
        </div>
      )}

      <div className="zs-action-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#6b726c' }}>
          <input type="checkbox" checked={hideZeros} onChange={(e) => setHideZeros(e.target.checked)} />
          Hide zero bars
        </label>
      </div>

      {error ? <div className="zs-feedback zs-feedback--error" style={{ marginTop: 12 }}>{error}</div> : null}

      <div className="zs-dashboard__row" style={{ marginTop: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <div style={{ color: '#6b726c', fontSize: 13 }}>Total revenue</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28 }}>
            {formatUSD(Number(summary.total_revenue || 0), { from: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b726c', fontSize: 13 }}>Appointments</div>
          <div style={{ fontWeight: 700 }}>{compactUSD(summary.appointment_revenue || 0)}</div>
        </div>
        <div>
          <div style={{ color: '#6b726c', fontSize: 13 }}>Shop</div>
          <div style={{ fontWeight: 700 }}>{compactUSD(summary.shop_revenue || 0)}</div>
        </div>
      </div>

      <div style={{ height: 320, marginTop: 14 }}>
        {!loading && rows.length === 0 ? (
          <p className="zs-card__description">No revenue data for this range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="zsGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d7b159" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#c9a84f" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(107,114,108,0.25)" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: '#6b726c' }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={{ fontSize: 12, fill: '#6b726c' }} tickFormatter={(v) => compactUSD(v)} width={64} />
              <Tooltip content={<RevenueTooltip />} />
              <Bar dataKey="total_revenue" fill="url(#zsGold)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
