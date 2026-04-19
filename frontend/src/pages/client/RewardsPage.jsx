import StatCard from '../../components/dashboard/StatCard'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function RewardsPage() {
  return (
    <div className="zs-grid">
      <StatCard title="Reward balance" value="1,240 pts" delta="+120 this month" tone="success" />
      <Card title="Redeem offers" description="Use points for perks.">
        <div className="zs-rewards">
          <div>
            <h4>500 pts</h4>
            <p>Free scalp massage upgrade</p>
          </div>
          <Button variant="secondary">Redeem</Button>
        </div>
        <div className="zs-rewards">
          <div>
            <h4>1,000 pts</h4>
            <p>Luxury hair treatment</p>
          </div>
          <Button variant="secondary">Redeem</Button>
        </div>
      </Card>
    </div>
  )
}
