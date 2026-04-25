import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import businessApi from '../../Api/businessApi'
import StaffScheduleGrid from '../../components/staff/StaffScheduleGrid'
import styles from './StaffPages.module.css'

export default function StaffSchedulePage() {
  const [view, setView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadSchedule = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await businessApi.staffSchedule({ view, date: selectedDate })
        if (!mounted) return
        setSchedule(response?.data?.data || null)
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load schedule right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSchedule()

    return () => {
      mounted = false
    }
  }, [selectedDate, view])

  const visibleDateLabel = useMemo(() => {
    const base = dayjs(selectedDate)
    return view === 'day'
      ? base.format('dddd, MMMM D, YYYY')
      : schedule?.from && schedule?.to
        ? `${dayjs(schedule.from).format('MMM D, YYYY')} - ${dayjs(schedule.to).format('MMM D, YYYY')}`
        : base.startOf('week').format('MMM D, YYYY')
  }, [schedule?.from, schedule?.to, selectedDate, view])

  const handlePrevious = () => {
    setSelectedDate((current) => dayjs(current).subtract(view === 'day' ? 1 : 7, 'day').format('YYYY-MM-DD'))
  }

  const handleNext = () => {
    setSelectedDate((current) => dayjs(current).add(view === 'day' ? 1 : 7, 'day').format('YYYY-MM-DD'))
  }

  const handleToday = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'))
    setView('day')
  }

  const appointments = schedule?.appointments || []
  const businessHours = schedule?.business_hours || { start: '07:00', end: '22:00' }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>My schedule</h2>
          <p className={styles.subtitle}>
            Appointment-driven schedule grid within business hours only.
          </p>
        </header>

        <section className={styles.card}>
          <div className={styles.scheduleToolbar}>
            <div className={styles.viewSwitch}>
              <button
                type="button"
                className={`${styles.viewButton} ${view === 'day' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('day')}
              >
                Day
              </button>
              <button
                type="button"
                className={`${styles.viewButton} ${view === 'week' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('week')}
              >
                Week
              </button>
            </div>

            <div className={styles.dateNav}>
              <button type="button" className={styles.navButton} onClick={handlePrevious}>
                Previous
              </button>
              <button type="button" className={styles.navButton} onClick={handleToday}>
                Today
              </button>
              <button type="button" className={styles.navButton} onClick={handleNext}>
                Next
              </button>
            </div>

            <div className={styles.scheduleMeta}>
              <span className={styles.metaLabel}>Showing</span>
              <strong className={styles.metaValue}>{visibleDateLabel}</strong>
            </div>
          </div>

          {loading ? (
            <p className={styles.state}>Loading schedule...</p>
          ) : error ? (
            <p className={`${styles.state} ${styles.stateError}`}>{error}</p>
          ) : (
            <StaffScheduleGrid
              view={schedule?.view || view}
              date={schedule?.date || selectedDate}
              from={schedule?.from}
              to={schedule?.to}
              businessHours={businessHours}
              appointments={appointments}
            />
          )}
        </section>
      </div>
    </div>
  )
}
