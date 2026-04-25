export default function MiniChart({ data, variant = 'revenue' }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const palette =
    variant === 'performance'
      ? {
          value: '#2f5f8f',
          bar: 'linear-gradient(180deg, rgba(90, 146, 208, 0.96) 0%, rgba(62, 111, 174, 0.62) 100%)',
        }
      : {
          value: '#7a5c10',
          bar: '#c9a84f',
        }

  const max = Math.max(...data.map((point) => Number(point.value) || 0), 1)
  const chartHeight = 104

  return (
    <div
      className="zs-mini-chart"
      role="img"
      aria-label={variant === 'performance' ? 'Performance trend' : 'Revenue trend'}
      style={{
        '--zs-mini-chart-value': palette.value,
        '--zs-mini-chart-bar': palette.bar,
      }}
    >
      {data.map((point) => (
        <div key={point.label} className="zs-mini-chart__bar">
          {(() => {
            const value = Number(point.value) || 0
            const height = value <= 0 ? 0 : Math.max(6, Math.round((value / max) * chartHeight))

            return (
              <>
                <strong className="zs-mini-chart__value">{point.displayValue || ''}</strong>
                <span style={{ height: `${height}px` }} />
              </>
            )
          })()}
          <small>{point.label}</small>
        </div>
      ))}
    </div>
  )
}
