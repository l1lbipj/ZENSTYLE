import { useEffect, useMemo, useState } from 'react'
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
      <PageHeader title="Welcome back" subtitle="Manage your appointments and rewards in one place." />
      <Section title="Your highlights" description="Quick view of your activity.">
        <div className="zs-dashboard__row">
          <StatCard title="Upcoming visits" value={String(metrics.upcoming_visits || 0)} delta="Next bookings" tone="accent" />
          <StatCard title="Reward points" value={String(metrics.reward_points || 0)} delta="Membership" tone="success" />
          <StatCard title="History count" value={String(metrics.history_count || 0)} delta="Completed visits" tone="neutral" />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Favorite services" description="Most booked by you">
          <MiniChart data={chartData.length ? chartData : [{ label: 'No data', value: 0 }]} />
        </Card>
        <Card title="Upcoming appointment" description="Next confirmed visit">
          {loading ? <p className="zs-card__description">Loading upcoming appointments...</p> : null}
          {!loading && (payload?.upcoming_appointments || []).length === 0 ? (
            <p className="zs-card__description">No data available.</p>
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
      <Section title="My schedule" description="A quick look at your calendar.">
        <CalendarView title="This week" />
      </Section>
    </div>
  )
}
