import Card from '../ui/Card'
import Badge from '../ui/Badge'

export default function StatCard({ title, value, delta, tone = 'neutral', icon }) {
  return (
    <Card>
      <div className="zs-stat">
        <div className="zs-stat__main">
          <span className="zs-stat__title">{title}</span>
          <h3 className="zs-stat__value">{value}</h3>
        </div>
        {icon && <div className="zs-stat__icon">{icon}</div>}
        {delta && (
          <div className="zs-stat__meta">
            <Badge tone={tone}>{delta}</Badge>
          </div>
        )}
      </div>
    </Card>
  )
}
