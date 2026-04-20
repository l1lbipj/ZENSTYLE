import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

function safeText(value) {
  if (value == null) return ''
  return String(value).trim()
}

export default function FeedbackManagementPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all') // all | pending | replied

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await businessApi.feedbackList({ per_page: 200 })
        const items = res?.data?.data?.data || res?.data?.data || []
        if (!mounted) return
        setRows(Array.isArray(items) ? items : [])
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load feedback right now.')
        setRows([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const mapped = useMemo(() => {
    const items = Array.isArray(rows) ? rows : []
    const normalized = items.map((fb) => {
      const replied = !!safeText(fb?.manager_reply) || !!fb?.replied_at
      return {
        id: fb?.feedback_id ?? fb?.id ?? `${fb?.appointment_id ?? 'appt'}-${fb?.created_at ?? Math.random()}`,
        appointmentId: fb?.appointment_id ?? '—',
        rating: fb?.rating ?? '—',
        notes: safeText(fb?.notes) || '—',
        reply: safeText(fb?.manager_reply) || '—',
        status: replied ? 'replied' : 'pending',
        createdAtRaw: fb?.created_at || null,
        repliedAtRaw: fb?.replied_at || null,
        createdAt: fb?.created_at ? formatDateTime(fb.created_at) : '—',
        repliedAt: fb?.replied_at ? formatDateTime(fb.replied_at) : '—',
      }
    })

    const filtered =
      filter === 'all' ? normalized : normalized.filter((x) => (filter === 'replied' ? x.status === 'replied' : x.status === 'pending'))

    // Latest first (admin moderation view)
    filtered.sort((a, b) => new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0))
    return filtered
  }, [rows, filter])

  const columns = useMemo(
    () => [
      { key: 'appointmentId', header: 'Appointment' },
      { key: 'rating', header: 'Rating' },
      { key: 'notes', header: 'Client notes' },
      { key: 'reply', header: 'Manager reply' },
      { key: 'createdAt', header: 'Created' },
      { key: 'repliedAt', header: 'Replied' },
      { key: 'status', header: 'Status' },
    ],
    [],
  )

  if (loading) {
    return (
      <div className="zs-dashboard">
        <PageHeader title="Feedback" subtitle="All client feedback across appointments." />
        <Section title="All feedback" description="Loading feedback...">
          <div className="zs-table zs-table--empty" role="status" aria-live="polite">
            <p className="zs-table__empty">Loading…</p>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Feedback" subtitle="All client feedback across appointments." />
      <Section
        title="All feedback"
        description="Review and manage feedback submitted by clients."
        action={
          <div className="zs-toolbar__filters">
            <button type="button" className={`zs-chip ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>
              All
            </button>
            <button type="button" className={`zs-chip ${filter === 'pending' ? 'is-active' : ''}`} onClick={() => setFilter('pending')}>
              Pending reply
            </button>
            <button type="button" className={`zs-chip ${filter === 'replied' ? 'is-active' : ''}`} onClick={() => setFilter('replied')}>
              Replied
            </button>
          </div>
        }
      >
        {error ? <p className="zs-feedback zs-feedback--error">{error}</p> : null}
        <DataTable
          caption="Feedback records"
          columns={columns}
          data={mapped.map((row) => ({
            ...row,
            status: <Badge tone={row.status === 'replied' ? 'success' : 'warning'}>{row.status}</Badge>,
          }))}
          actionsLabel=""
          renderActions={() => <span className="zs-muted">—</span>}
          emptyMessage="No feedback found."
        />
      </Section>
    </div>
  )
}

