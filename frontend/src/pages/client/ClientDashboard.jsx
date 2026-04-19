import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import MiniChart from '../../components/dashboard/MiniChart'
import Card from '../../components/ui/Card'
import CalendarView from '../../components/calendar/CalendarView'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

export default function ClientDashboard() {
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

  const metrics = payload?.metrics || {}
  const chartData = useMemo(
    () =>
      (payload?.favorite_services || []).map((item) => ({
        label: item.service_name,
        value: Number(item.usage_count || 0),
      })),
    [payload],
  )

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Your ZenStyle space"
        subtitle="Check your next visit, rewards, and favorite services in one place."
        action={
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book a new appointment
          </Link>
        }
      />
      <Section title="Your highlights" description="A quick snapshot of your account.">
        <div className="zs-dashboard__row">
          <StatCard title="Upcoming visits" value={String(metrics.upcoming_visits || 0)} delta="Appointments ahead" tone="accent" />
          <StatCard title="Reward points" value={String(metrics.reward_points || 0)} delta="Your current balance" tone="success" />
          <StatCard title="Past visits" value={String(metrics.history_count || 0)} delta="Completed appointments" tone="neutral" />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Favorite services" description="The treatments you come back to most often.">
          <MiniChart data={chartData.length ? chartData : [{ label: 'No data', value: 0 }]} />
        </Card>
        <Card
          title="Upcoming appointment"
          description="Your next confirmed booking."
          actions={
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
              View all
            </Link>
          }
        >
          {loading ? <p className="zs-card__description">Loading upcoming appointments...</p> : null}
          {!loading && (payload?.upcoming_appointments || []).length === 0 ? (
            <p className="zs-card__description">You do not have any upcoming appointments yet.</p>
          ) : null}
          {!loading &&
            (payload?.upcoming_appointments || []).slice(0, 2).map((item) => (
              <div key={item.appointment_id} className="zs-task">
                <div>
                  <h4>{item.appointment_details?.[0]?.item?.service_name || item.appointment_details?.[0]?.item?.product_name || 'Service'}</h4>
                  <p>{formatDateTime(item.appointment_date)}</p>
                </div>
                <span className="zs-badge zs-badge--accent">{item.status}</span>
              </div>
            ))}
        </Card>
      </div>
      <Section title="Weekly view" description="A simple look at your upcoming booking schedule.">
        <CalendarView title="This week" />
      </Section>
    </div>
  )
}
