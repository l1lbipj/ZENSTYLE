import { useEffect, useState } from 'react'
import CalendarView from '../../components/calendar/CalendarView'
import businessApi from '../../Api/businessApi'
import { formatDateWithWeekday, formatTime } from '../../utils/dateTime'
import ScheduleSection from '../../components/staff/ScheduleSection'
import styles from './StaffPages.module.css'

export default function StaffSchedulePage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadSchedules = async () => {
      setLoading(true)
      setError('')
      try {
        const [scheduleRes, dashboardRes] = await Promise.allSettled([
          businessApi.staffSchedules({ sort: 'date:asc' }),
          businessApi.dashboardStaff(),
        ])

        const scheduleItems =
          scheduleRes.status === 'fulfilled'
            ? scheduleRes.value?.data?.data?.data || scheduleRes.value?.data?.data?.items || []
            : []

        const fallbackItems =
          dashboardRes.status === 'fulfilled'
            ? dashboardRes.value?.data?.data?.today_schedule || []
            : []

        const merged = [...(Array.isArray(scheduleItems) ? scheduleItems : []), ...(Array.isArray(fallbackItems) ? fallbackItems : [])]

        const uniqueById = Array.from(
          new Map(merged.map((item) => [item.schedule_id ?? `${item.date}-${item.shift_id}-${item.check_in}`, item])).values(),
        )

        uniqueById.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        if (mounted) setSchedules(uniqueById)
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load schedules right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSchedules()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>My schedule</h2>
          <p className={styles.subtitle}>Review upcoming appointments and shift coverage.</p>
        </header>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Weekly calendar</h3>
          <CalendarView
            title="This week"
            columns={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            busyItems={schedules}
          />
        </section>

        <ScheduleSection
          title="Work schedule"
          description="Sorted by nearest working day."
          loading={loading}
          error={error}
          emptyMessage="No schedule assigned yet."
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'shift', label: 'Shift' },
            { key: 'time', label: 'Time range' },
          ]}
          rows={schedules.map((shift) => ({
            key: shift.schedule_id ?? `${shift.date}-${shift.shift_id}-${shift.check_in}`,
            date: formatDateWithWeekday(shift.date),
            shift: shift.shift?.shift_name || shift.shift_name || 'Shift',
            time: `${formatTime(shift.check_in)} - ${formatTime(shift.check_out)}`,
          }))}
        />
      </div>
    </div>
  )
}
