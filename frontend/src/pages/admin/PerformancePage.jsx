import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import DataTable from '../../components/tables/DataTable'
import PerformanceTrendChart from '../../components/dashboard/PerformanceTrendChart'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatCard from '../../components/dashboard/StatCard'
import businessApi from '../../Api/businessApi'

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function quickPresetRange(preset) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (preset === 'today') {
    return { from: localDateString(now), to: localDateString(now), group: 'hour' }
  }

  if (preset === 'this_week' || preset === 'last_7_days') {
    const from = new Date(today)
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7))
    const to = new Date(from)
    to.setDate(from.getDate() + 6)
    return { from: localDateString(from), to: localDateString(to), group: 'day' }
  }

  if (preset === 'this_year') {
    return {
      from: localDateString(new Date(now.getFullYear(), 0, 1)),
      to: localDateString(new Date(now.getFullYear(), 11, 31)),
      group: 'month',
    }
  }

  return {
    from: localDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    group: 'day',
  }
}

function customRangeDefaults() {
  const now = new Date()
  return {
    from: localDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDateString(now),
    group: 'day',
  }
}

function suggestCustomGroup(fromDate, toDate) {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1)

  if (days <= 7) return 'day'
  if (days <= 60) return 'week'
  return 'month'
}

export default function PerformancePage() {
  const customInitial = useMemo(() => customRangeDefaults(), [])

  const [mode, setMode] = useState('quick')
  const [preset, setPreset] = useState('this_month')
  const [groupBy, setGroupBy] = useState(quickPresetRange('this_month').group)
  const [fromDate, setFromDate] = useState(customInitial.from)
  const [toDate, setToDate] = useState(customInitial.to)
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPerformance = useCallback(
    ({ nextMode = mode, nextPreset = preset, nextFrom = fromDate, nextTo = toDate, nextGroup = groupBy } = {}) => {
      const params =
        nextMode === 'custom'
          ? {
              mode: 'custom',
              from_date: nextFrom,
              to_date: nextTo,
              group_by: nextGroup,
            }
          : {
              mode: 'quick',
              preset: nextPreset,
              group_by: nextGroup,
            }

      setLoading(true)
      setError('')

      businessApi
        .operationsPerformance(params)
        .then((res) => setPayload(res?.data?.data || null))
        .catch((err) => {
          setError(err?.response?.data?.message || 'Unable to load performance overview.')
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [mode, preset, fromDate, toDate, groupBy],
  )

  useEffect(() => {
    loadPerformance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = payload?.summary || {}

  const staffRows = useMemo(
    () =>
      (payload?.staff_performance || []).map((item) => ({
        id: item.staff_id,
        staff: item.staff_name,
        specialization: item.specialization || '-',
        completed: String(item.completed_tasks || 0),
        appointments: String(item.appointments_served || 0),
        revenue: `$${Number(item.revenue || 0).toLocaleString()}`,
        attendance: `${Number(item.attendance_rate || 0).toFixed(1)}%`,
        feedback: item.feedback_count ? `${Number(item.feedback_average || 0).toFixed(1)} / 5 (${item.feedback_count})` : 'No feedback',
        score: Number(item.performance_score || 0).toFixed(1),
        raw: item,
      })),
    [payload],
  )

  const serviceRows = useMemo(
    () =>
      (payload?.service_efficiency || []).map((item) => ({
        id: item.service_name,
        service: item.service_name,
        completed: String(item.completed_lines || 0),
        total: String(item.total_lines || 0),
        rate: `${Number(item.completion_rate || 0).toFixed(1)}%`,
        avg: `${Number(item.avg_minutes || 0).toFixed(1)} min`,
        appointments: String(item.appointments_count || 0),
        raw: item,
      })),
    [payload],
  )

  const trendData = useMemo(
    () =>
      (payload?.trend || []).map((item) => ({
        label: item.label || new Date(item.day).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        appointments: Number(item.appointments || 0),
        completed_appointments: Number(item.completed_appointments || 0),
        completion_rate: Number(item.completion_rate || 0),
        revenue: Number(item.revenue || 0),
      })),
    [payload],
  )

  const topStaff = payload?.staff_performance?.[0] || null
  const completedTasks = Number(summary.completed_tasks || 0)
  const activeTasks = Number(summary.active_tasks || 0)
  const totalServiceTasks = completedTasks + activeTasks

  const activateQuickPreset = (nextPreset) => {
    const next = quickPresetRange(nextPreset)
    setMode('quick')
    setPreset(nextPreset)
    setGroupBy(next.group)
    loadPerformance({ nextMode: 'quick', nextPreset, nextGroup: next.group })
  }

  const activateMode = (nextMode) => {
    if (nextMode === mode) return

    if (nextMode === 'quick') {
      setMode('quick')
      setPreset('this_month')
      const next = quickPresetRange('this_month')
      setGroupBy(next.group)
      setFromDate(customInitial.from)
      setToDate(customInitial.to)
      loadPerformance({ nextMode: 'quick', nextPreset: 'this_month', nextGroup: next.group })
      return
    }

    const next = customRangeDefaults()
    const suggestedGroup = suggestCustomGroup(next.from, next.to)
    setMode('custom')
    setPreset('this_month')
    setGroupBy(suggestedGroup)
    setFromDate(next.from)
    setToDate(next.to)
    loadPerformance({ nextMode: 'custom', nextFrom: next.from, nextTo: next.to, nextGroup: suggestedGroup })
  }

  const activateGroup = (nextGroup) => {
    setGroupBy(nextGroup)
    if (mode === 'custom') {
      loadPerformance({ nextMode: 'custom', nextFrom: fromDate, nextTo: toDate, nextGroup })
    }
  }

  const applyCustomRange = () => {
    const nextGroup = ['day', 'week', 'month'].includes(groupBy) ? groupBy : suggestCustomGroup(fromDate, toDate)
    if (!['day', 'week', 'month'].includes(groupBy)) {
      setGroupBy(nextGroup)
    }
    loadPerformance({
      nextMode: 'custom',
      nextFrom: fromDate,
      nextTo: toDate,
      nextGroup,
    })
  }

  const groupOptions = ['day', 'week', 'month']

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Performance"
        subtitle="Admin overview built from appointments, staff schedules, feedback, and service completion."
      />

      <div className="zs-filter-modebar">
        <div className="zs-toolbar__filters" aria-label="Performance filter mode">
          <button
            type="button"
            className={`zs-chip ${mode === 'quick' ? 'is-active' : ''}`}
            aria-pressed={mode === 'quick'}
            onClick={() => activateMode('quick')}
          >
            Quick Filter
          </button>
          <button
            type="button"
            className={`zs-chip ${mode === 'custom' ? 'is-active' : ''}`}
            aria-pressed={mode === 'custom'}
            onClick={() => activateMode('custom')}
          >
            Custom Range
          </button>
        </div>
        {mode === 'custom' ? (
          <div className="zs-toolbar__filters" aria-label="Performance group by">
            {groupOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`zs-chip ${groupBy === item ? 'is-active' : ''}`}
                aria-pressed={groupBy === item}
                onClick={() => activateGroup(item)}
              >
                {item === 'day' ? 'Day' : item === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        ) : null}
        <div style={{ marginLeft: 'auto', color: '#6b726c', fontSize: 13 }}>
          Mode: <strong>{mode === 'quick' ? 'Quick Filter' : 'Custom Range'}</strong>
        </div>
      </div>

      {mode === 'quick' ? (
        <div className="zs-action-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {['today', 'this_week', 'this_month', 'this_year'].map((item) => (
            <button
              key={item}
              type="button"
              className={`zs-chip ${preset === item ? 'is-active' : ''}`}
              aria-pressed={preset === item}
              onClick={() => activateQuickPreset(item)}
            >
              {item === 'today' ? 'Today' : item === 'this_week' ? 'This Week' : item === 'this_month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      ) : (
        <div className="zs-action-row" style={{ marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="zs-input"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            className="zs-input"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <button type="button" className="zs-btn zs-btn--secondary zs-btn--sm" onClick={applyCustomRange} disabled={loading}>
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      )}

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <StatCard title="Appointments" value={String(summary.total_appointments || 0)} delta={`${String(summary.completed_appointments || 0)} completed`} tone="success" />
        <StatCard title="Revenue" value={`$${Number(summary.revenue || 0).toLocaleString()}`} delta={`Avg. $${Number(summary.average_revenue || 0).toLocaleString()}`} tone="success" />
        <StatCard title="Completion" value={`${Number(summary.completion_rate || 0).toFixed(1)}%`} delta={`${String(summary.active_appointments || 0)} active`} tone="accent" />
        <StatCard title="Attendance" value={`${Number(summary.attendance_rate || 0).toFixed(1)}%`} delta="Schedules in range" tone="neutral" />
      </div>

      <div className="zs-dashboard__row">
        <Card title="Feedback" description="Average client rating in the selected range.">
          <h3 style={{ margin: 0 }}>{Number(summary.feedback_average || 0).toFixed(1)} / 5</h3>
          <p className="zs-card__description">{String(summary.feedback_count || 0)} feedback records</p>
        </Card>
        <Card title="Service tasks" description="Completed versus active service lines.">
          <h3 style={{ margin: 0 }}>{completedTasks} / {totalServiceTasks}</h3>
          <p className="zs-card__description">{activeTasks} active line items</p>
        </Card>
        <Card title="Top staff" description="Highest performance score in this range.">
          <h3 style={{ margin: 0 }}>{topStaff?.staff_name || '-'}</h3>
          <p className="zs-card__description">{topStaff ? `${Number(topStaff.performance_score || 0).toFixed(1)} points` : 'No ranking data yet'}</p>
        </Card>
      </div>

      <Section
        title="Performance trend"
        description={
          mode === 'quick'
            ? 'Quick revenue trend with a line that follows the bar height.'
            : 'Custom revenue trend with a line that follows the bar height.'
        }
      >
        {loading ? <p className="zs-card__description">Loading performance data...</p> : null}
        {!loading && trendData.length > 0 ? (
          <PerformanceTrendChart data={trendData} loading={loading} />
        ) : null}
        {!loading && trendData.length === 0 ? (
          <p className="zs-card__description">No performance data available.</p>
        ) : null}
      </Section>

      <Section title="Staff performance" description="Ranking across output, revenue, attendance, and client feedback.">
        <DataTable
          columns={[
            { key: 'staff', header: 'Staff' },
            { key: 'specialization', header: 'Specialization' },
            { key: 'completed', header: 'Completed' },
            { key: 'appointments', header: 'Appointments' },
            { key: 'revenue', header: 'Revenue' },
            { key: 'attendance', header: 'Attendance' },
            { key: 'feedback', header: 'Feedback' },
            { key: 'score', header: 'Score' },
          ]}
          data={staffRows}
          emptyMessage="No staff analytics available for this range."
          renderActions={(row) => (
            <div className="zs-table__actions">
              <Badge tone={Number(row.raw.performance_score || 0) >= 70 ? 'success' : 'warning'}>
                {Number(row.raw.performance_score || 0) >= 70 ? 'Strong' : 'Needs review'}
              </Badge>
            </div>
          )}
        />
      </Section>

      <Section title="Service efficiency" description="How each service is performing in completion speed and consistency.">
        <DataTable
          columns={[
            { key: 'service', header: 'Service' },
            { key: 'completed', header: 'Completed' },
            { key: 'total', header: 'Total' },
            { key: 'rate', header: 'Completion' },
            { key: 'avg', header: 'Avg. time' },
            { key: 'appointments', header: 'Appointments' },
          ]}
          data={serviceRows}
          emptyMessage="No service analytics available for this range."
        />
      </Section>
    </div>
  )
}
