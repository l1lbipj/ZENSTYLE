export default function MiniChart({ data }) {
  const max = Math.max(...data.map((point) => point.value), 1)

  return (
    <div className="zs-mini-chart" role="img" aria-label="Revenue trend">
      {data.map((point) => (
        <div key={point.label} className="zs-mini-chart__bar">
          <span style={{ height: `${(point.value / max) * 100}%` }} />
          <small>{point.label}</small>
        </div>
      ))}
    </div>
  )
}
