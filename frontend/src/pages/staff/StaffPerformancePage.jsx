import { useCallback, useEffect, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'

export default function StaffPerformancePage() {
  const [range, setRange] = useState('month')
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPerformance = useCallback(() => {
    let mounted = true
    setLoading(true)
    setError('')

    businessApi
      .operationsPerformance({ range })
      .then((res) => {
        if (!mounted) return
        setPayload(res?.data?.data || null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load staff performance.')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [range])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPerformance()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadPerformance])

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My performance"
        subtitle="Track service output and productivity over time."
        action={
          <div className="zs-toolbar__filters">
            {['day', 'month', 'year'].map((item) => (
              <button
                key={item}
                type="button"
                className={`zs-chip ${range === item ? 'is-active' : ''}`}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Completed tasks" description="Finished service items in the selected range.">
          <h3 style={{ margin: 0 }}>{String(payload?.completed_tasks || 0)}</h3>
        </Card>
        <Card title="Active tasks" description="Tasks still in progress.">
          <h3 style={{ margin: 0 }}>{String(payload?.active_tasks || 0)}</h3>
        </Card>
        <Card title="Revenue contribution" description="Linked revenue from your completed appointments.">
          <h3 style={{ margin: 0 }}>${Number(payload?.revenue || 0).toLocaleString()}</h3>
        </Card>
      </div>

      <Section title="Performance summary" description="A compact operational view for your work history.">
        {loading ? <p className="zs-card__description">Loading performance data...</p> : null}
        {!loading ? (
          <div className="zs-dashboard__row">
            <Card title="Range" description="Current reporting window.">
              <Badge tone="accent">{payload?.range || range}</Badge>
            </Card>
            <Card title="Period start" description="The analytics window begins here.">
              <p className="zs-card__description">{payload?.start ? new Date(payload.start).toLocaleString() : '-'}</p>
            </Card>
            <Card title="Period end" description="The analytics window ends here.">
              <p className="zs-card__description">{payload?.end ? new Date(payload.end).toLocaleString() : '-'}</p>
            </Card>
          </div>
        ) : null}
      </Section>
    </div>
  )
}
