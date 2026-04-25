import {
  Cell,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from 'recharts'

function formatCurrency(value) {
  const num = Number(value || 0)
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`
  return `$${num.toFixed(0)}`
}

function PerformanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload || {}

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid rgba(59,130,246,0.18)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
        minWidth: 210,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, color: '#17324d' }}>{label}</div>
      <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#475569' }}>
        <div>
          Revenue: <strong style={{ color: '#14532d' }}>{formatCurrency(row.revenue || 0)}</strong>
        </div>
        <div>
          Completed: <strong style={{ color: '#1d4ed8' }}>{Number(row.completed_appointments || 0)}</strong>
        </div>
        <div>
          Completion rate: <strong style={{ color: '#0f172a' }}>{Number(row.completion_rate || 0).toFixed(1)}%</strong>
        </div>
        <div>
          Appointments: <strong style={{ color: '#0f172a' }}>{Number(row.appointments || 0)}</strong>
        </div>
      </div>
    </div>
  )
}

function PerformanceBarShape(props) {
  const { x, y, width, height, fill, fillOpacity } = props
  const minHeight = 8
  const barHeight = Math.max(Number(height || 0), minHeight)
  const barY = Number(y || 0) + Number(height || 0) - barHeight

  return (
    <rect
      x={x}
      y={barY}
      width={width}
      height={barHeight}
      rx={10}
      ry={10}
      fill={fill}
      fillOpacity={fillOpacity}
    />
  )
}

export default function PerformanceTrendChart({ data = [], loading = false }) {
  if (!loading && (!Array.isArray(data) || data.length === 0)) {
    return <p className="zs-card__description">No performance data available.</p>
  }

  const maxRevenue = Math.max(...data.map((item) => Number(item.revenue || 0)), 1)

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="zsPerformanceBars" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.78} />
            </linearGradient>
            <linearGradient id="zsPerformanceBarsSoft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="4 8" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
            tick={{ fontSize: 12, fill: '#64748b' }}
            interval="preserveStartEnd"
            minTickGap={22}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
            tick={{ fontSize: 12, fill: '#64748b' }}
            width={42}
            allowDecimals={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<PerformanceTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            barSize={26}
            shape={<PerformanceBarShape />}
            isAnimationActive
            animationDuration={650}
          >
            {data.map((entry, index) => {
              const revenue = Number(entry.revenue || 0)
              const isPeak = revenue > 0 && revenue === maxRevenue
              const isZero = revenue <= 0

              return (
                <Cell
                  key={`cell-${entry.day || entry.label || index}`}
                  fill={isPeak ? 'url(#zsPerformanceBars)' : 'url(#zsPerformanceBarsSoft)'}
                  fillOpacity={isZero ? 0.18 : isPeak ? 1 : 0.72}
                />
              )
            })}
          </Bar>
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            name="Revenue trend"
            stroke="#1d4ed8"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={650}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
