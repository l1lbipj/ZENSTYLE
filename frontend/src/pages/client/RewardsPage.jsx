import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'

const offers = [
  { id: 'scalp', points: 500, title: 'Scalp massage upgrade', description: 'A relaxing add-on for your next visit.' },
  { id: 'treatment', points: 1000, title: 'Luxury hair treatment', description: 'Redeem points for a premium care session.' },
  { id: 'voucher', points: 1500, title: 'Beauty voucher', description: 'Use your rewards as credit on selected services.' },
]

export default function RewardsPage() {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    businessApi
      .dashboardClient()
      .then((res) => {
        if (!mounted) return
        setPayload(res?.data?.data || null)
      })
      .catch(() => {
        if (!mounted) return
        setPayload(null)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const rewardPoints = Number(payload?.metrics?.reward_points || 0)
  const historyCount = Number(payload?.metrics?.history_count || 0)

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Rewards"
        subtitle="Track your points and see what you can redeem on future appointments."
        action={
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Earn more points
          </Link>
        }
      />

      <div className="zs-dashboard__row">
        <StatCard title="Current points" value={String(rewardPoints)} delta="Available now" tone="success" />
        <StatCard title="Completed visits" value={String(historyCount)} delta="More visits, more rewards" tone="accent" />
        <StatCard title="Next milestone" value={rewardPoints >= 1500 ? 'Unlocked' : `${Math.max(1500 - rewardPoints, 0)} pts`} delta="Until premium voucher" tone="neutral" />
      </div>

      <Section title="How rewards work" description="Your points grow with every completed service.">
        <div className="zs-dashboard__row">
          <Card title="Collect" description="Earn points from completed appointments and loyal visits.">
            <p className="zs-card__description">Each finished appointment helps build your next reward milestone.</p>
          </Card>
          <Card title="Redeem" description="Use points for perks, upgrades, and selected beauty experiences.">
            <p className="zs-card__description">You can talk to staff at checkout when you want to apply a reward.</p>
          </Card>
        </div>
      </Section>

      <Section title="Available offers" description="These are sample rewards based on your current balance.">
        {loading ? <p className="zs-card__description">Loading rewards...</p> : null}
        {!loading ? (
          <div className="zs-dashboard__row">
            {offers.map((offer) => {
              const canRedeem = rewardPoints >= offer.points
              return (
                <Card
                  key={offer.id}
                  title={offer.title}
                  description={`${offer.points} points`}
                  actions={
                    <button type="button" className={`zs-btn ${canRedeem ? 'zs-btn--secondary' : 'zs-btn--ghost'} zs-btn--sm`} disabled={!canRedeem}>
                      {canRedeem ? 'Ready to redeem' : 'Not enough points'}
                    </button>
                  }
                >
                  <p className="zs-card__description">{offer.description}</p>
                </Card>
              )
            })}
          </div>
        ) : null}
      </Section>
    </div>
  )
}
