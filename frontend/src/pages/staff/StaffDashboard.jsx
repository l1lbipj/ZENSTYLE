import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import CalendarView from '../../components/calendar/CalendarView'
import businessApi from '../../Api/businessApi'
import { formatDate, formatFullDateTime, formatTime } from '../../utils/dateTime'
import AttendancePanel from '../../components/staff/AttendancePanel'
import styles from './StaffPages.module.css'

export default function StaffDashboard() {
  const ATTENDANCE_PAGE_SIZE = 7
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [attendancePage, setAttendancePage] = useState(1)
  const [todaySchedule, setTodaySchedule] = useState([])

  const normalizeAttendanceFromSchedule = (schedules) => {
    const today = schedules?.[0] || null
    if (!today) return null
    return {
      date: today.date,
      check_in: today.actual_check_in || null,
      check_out: today.actual_check_out || null,
      status: today.actual_check_out ? 'checked_out' : today.actual_check_in ? 'checked_in' : 'not_checked_in',
      schedule_id: today.schedule_id,
    }
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const [dashboardRes, todayRes, historyRes, scheduleRes] = await Promise.allSettled([
        businessApi.dashboardStaff(),
        businessApi.staffAttendanceToday(),
        businessApi.staffAttendanceHistory({ per_page: 30 }),
        businessApi.staffSchedule({ view: 'day', date: today }),
      ])

      const dashboardData = dashboardRes.status === 'fulfilled' ? dashboardRes.value?.data?.data || null : null
      setPayload(dashboardData)

      const todayData =
        todayRes.status === 'fulfilled'
          ? todayRes.value?.data?.data || null
          : normalizeAttendanceFromSchedule(dashboardData?.today_schedule || [])

      setTodayAttendance(todayData)

      const historyData =
        historyRes.status === 'fulfilled'
          ? historyRes.value?.data?.data?.data || historyRes.value?.data?.data || []
          : dashboardData?.today_schedule || []
      setAttendanceHistory(Array.isArray(historyData) ? historyData : [])

      const scheduleData =
        scheduleRes.status === 'fulfilled'
          ? scheduleRes.value?.data?.data?.appointments || []
          : []
      setTodaySchedule(Array.isArray(scheduleData) ? scheduleData : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load staff dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleAttendanceAction = async (action) => {
    if (!todayAttendance) return
    setAttendanceLoading(true)
    setMessage('')
    setError('')
    try {
      if (action === 'check_in') {
        await businessApi.staffCheckIn({ schedule_id: todayAttendance.schedule_id })
        setMessage('Check-in successful.')
      } else {
        await businessApi.staffCheckOut({ schedule_id: todayAttendance.schedule_id })
        setMessage('Check-out successful.')
      }
      await loadDashboard()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to complete attendance action.')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const metrics = payload?.metrics || {}
  const attendanceState = todayAttendance?.status || 'not_checked_in'
  const canCheckIn = attendanceState === 'not_checked_in'
  const canCheckOut = attendanceState === 'checked_in'

  const formatAttendanceTime = (value) => {
    if (!value) return '--'
    if (typeof value === 'string' && value.length > 8) return formatFullDateTime(value)
    return formatTime(value)
  }

  const historyRows = [...attendanceHistory].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  const attendanceTotalPages = Math.max(1, Math.ceil(historyRows.length / ATTENDANCE_PAGE_SIZE))
  const visibleAttendanceRows = historyRows.slice(
    (attendancePage - 1) * ATTENDANCE_PAGE_SIZE,
    attendancePage * ATTENDANCE_PAGE_SIZE,
  )

  const getPriorityTone = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'completed') return 'completed'
    if (normalized === 'cancelled') return 'cancelled'
    return 'scheduled'
  }

  const priorityTasks = useMemo(() => {
    return [...todaySchedule].sort((a, b) => {
      const aTime = `${a?.start_time || '23:59'}`
      const bTime = `${b?.start_time || '23:59'}`
      return aTime.localeCompare(bTime)
    })
  }, [todaySchedule])

  const scheduleSummary = useMemo(() => {
    return todaySchedule.reduce(
      (acc, task) => {
        const tone = getPriorityTone(task.status)
        acc.total += 1
        acc[tone] += 1
        return acc
      },
      { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
    )
  }, [todaySchedule])

  useEffect(() => {
    setAttendancePage(1)
  }, [attendanceHistory])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Today overview</h2>
          <p className={styles.subtitle}>Keep an eye on tasks and appointments in real time.</p>
        </header>
        {loading ? <p className={styles.state}>Loading dashboard...</p> : null}
        {error ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{error}</p> : null}
        {message ? <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{message}</p> : null}

        <section className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Appointments today</p>
            <p className={styles.metricValue}>{String(metrics.appointments_today || 0)}</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Pending tasks</p>
            <p className={styles.metricValue}>{String(metrics.pending_tasks || 0)}</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Completed tasks</p>
            <p className={styles.metricValue}>{String(metrics.completed_tasks || 0)}</p>
          </article>
        </section>

        <section className={styles.panelGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Schedule</h3>
            <CalendarView title="Today's schedule" busyItems={todaySchedule} />
            <div className={styles.scheduleSummary}>
              <span className={styles.scheduleSummaryItem}>Total: {scheduleSummary.total}</span>
              <span className={`${styles.scheduleSummaryItem} ${styles.scheduled}`}>Scheduled: {scheduleSummary.scheduled}</span>
              <span className={`${styles.scheduleSummaryItem} ${styles.completed}`}>Completed: {scheduleSummary.completed}</span>
              <span className={`${styles.scheduleSummaryItem} ${styles.cancelled}`}>Cancelled: {scheduleSummary.cancelled}</span>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Priority tasks</h3>
            {priorityTasks.length > 0 ? (
              <ul className={styles.priorityList}>
                {priorityTasks.slice(0, 3).map((task) => (
                  <li key={task.appointment_id} className={styles.priorityItem}>
                    <Link className={styles.priorityLink} to={`/staff/tasks?appointment_id=${task.appointment_id}`}>
                      <div className={styles.priorityTopRow}>
                        <strong className={styles.priorityTitle}>{task.service_name || 'Service'}</strong>
                        <span className={`${styles.priorityBadge} ${styles[getPriorityTone(task.status)]}`}>
                          {task.status || 'Scheduled'}
                        </span>
                      </div>
                      <div className={styles.priorityMeta}>{task.customer_name || 'Client'}</div>
                      <div className={styles.priorityMeta}>
                        {formatTime(task.start_time)} - {formatTime(task.end_time)}
                      </div>
                      <div className={styles.priorityMeta}>{task.assigned_staff_name || 'Assigned staff'}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.state}>No appointments scheduled for today.</p>
            )}
          </div>
        </section>

        <AttendancePanel
          todayTitle="Today attendance"
          todayDescription={todayAttendance?.date ? formatDate(todayAttendance.date) : 'No schedule for today'}
          todayStatus={attendanceState}
          checkInText={formatAttendanceTime(todayAttendance?.check_in)}
          checkOutText={formatAttendanceTime(todayAttendance?.check_out)}
          canCheckIn={canCheckIn}
          canCheckOut={canCheckOut}
          attendanceLoading={attendanceLoading}
          onCheckIn={() => handleAttendanceAction('check_in')}
          onCheckOut={() => handleAttendanceAction('check_out')}
          historyRows={visibleAttendanceRows.map((entry, index) => ({
            key: entry.attendance_id ?? entry.schedule_id ?? `${entry.date}-${index}`,
            date: formatDate(entry.date),
            checkIn: formatAttendanceTime(entry.check_in),
            checkOut: formatAttendanceTime(entry.check_out),
            status: entry.attendance_status || (entry.check_out ? 'present' : entry.check_in ? 'late' : 'absent'),
          }))}
          historyPage={attendancePage}
          historyTotalPages={attendanceTotalPages}
          onHistoryPrev={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
          onHistoryNext={() => setAttendancePage((prev) => Math.min(attendanceTotalPages, prev + 1))}
        />
      </div>
    </div>
  )
}
