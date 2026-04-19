import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

export default function ServiceHistoryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    businessApi
      .clientHistory({ per_page: 20 })
      .then((res) => {
        if (!mounted) return
        const list = res?.data?.data?.data || []
        setRows(
          list.map((appt) => {
            const detail = appt.appointment_details?.[0]
            return {
              id: appt.appointment_id,
              name: detail?.item?.service_name || detail?.item?.product_name || 'Service',
              time: formatDateTime(appt.appointment_date),
              status: appt.status || 'completed',
              rating: appt.feedback?.rating || null,
            }
          }),
        )
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load service history.')
        setRows([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const completedCount = useMemo(() => rows.length, [rows])

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Service history"
        subtitle="Look back at your past appointments and the treatments you have already completed."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/feedback">
            Leave feedback
          </Link>
        }
      />

      <div className="zs-dashboard__row">
        <Card title="Completed visits" description="Your finished appointments so far.">
          <h3 style={{ margin: 0 }}>{completedCount}</h3>
        </Card>
        <Card title="Next step" description="Book again whenever you are ready for your next visit.">
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book again
          </Link>
        </Card>
      </div>

      <Section title="Past appointments" description="Your most recent service history appears here.">
        {loading ? <p className="zs-card__description">Loading service history...</p> : null}
        {!loading && error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}
        {!loading && !error && rows.length === 0 ? (
          <Card title="No service history yet" description="Your completed visits will show up here after your first appointment." />
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <div className="zs-dashboard__row">
            {rows.map((row) => (
              <Card
                key={row.id}
                title={row.name}
                description={row.time}
                actions={<Badge tone="success">{row.status}</Badge>}
              >
                <p className="zs-card__description">
                  {row.rating ? `Your rating: ${row.rating}/5` : 'No feedback submitted yet.'}
                </p>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  )
}
