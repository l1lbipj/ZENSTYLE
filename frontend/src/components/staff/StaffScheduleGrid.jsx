import dayjs from 'dayjs'
import { formatDateWithWeekday, formatTime } from '../../utils/dateTime'
import styles from './StaffScheduleGrid.module.css'

const BUSINESS_START_MINUTES = 7 * 60
const BUSINESS_END_MINUTES = 22 * 60
const SLOT_MINUTES = 30

function toMinutes(value) {
  if (!value) return null
  const [hour = '0', minute = '0'] = String(value).split(':')
  return (Number(hour) * 60) + Number(minute)
}

function toSlotLabel(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
  const minute = String(minutes % 60).padStart(2, '0')
  return `${hour}:${minute}`
}

function buildDays(view, date, from, to) {
  if (view === 'day') {
    return [dayjs(date)]
  }

  const start = from ? dayjs(from) : dayjs(date).startOf('week')
  const end = to ? dayjs(to) : start.add(6, 'day')
  const days = []

  let cursor = start.startOf('day')
  while (cursor.isSame(end, 'day') || cursor.isBefore(end, 'day')) {
    days.push(cursor)
    cursor = cursor.add(1, 'day')
  }

  return days
}

function getStatusTone(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'completed') return 'completed'
  if (normalized === 'cancelled') return 'cancelled'
  return 'scheduled'
}

function buildAppointmentPlacement(appointment) {
  const startMinutes = toMinutes(appointment.start_time)
  const endMinutes = toMinutes(appointment.end_time)

  if (startMinutes === null || endMinutes === null) {
    return null
  }

  const boundedStart = Math.max(startMinutes, BUSINESS_START_MINUTES)
  const boundedEnd = Math.min(endMinutes, BUSINESS_END_MINUTES)
  if (boundedEnd <= boundedStart) {
    return null
  }

  const rowStart = Math.floor((boundedStart - BUSINESS_START_MINUTES) / SLOT_MINUTES) + 1
  const rowEnd = Math.max(rowStart + 1, Math.ceil((boundedEnd - BUSINESS_START_MINUTES) / SLOT_MINUTES) + 1)

  return {
    rowStart,
    rowEnd,
  }
}

export default function StaffScheduleGrid({ view, date, from, to, businessHours, appointments }) {
  const days = buildDays(view, date, from, to)
  const slotCount = Math.floor((BUSINESS_END_MINUTES - BUSINESS_START_MINUTES) / SLOT_MINUTES)
  const slots = Array.from({ length: slotCount }, (_, index) => BUSINESS_START_MINUTES + (index * SLOT_MINUTES))
  const todayKey = dayjs().format('YYYY-MM-DD')
  const currentMinutes = dayjs().hour() * 60 + dayjs().minute()
  const activeRowIndex =
    currentMinutes >= BUSINESS_START_MINUTES && currentMinutes < BUSINESS_END_MINUTES
      ? Math.floor((currentMinutes - BUSINESS_START_MINUTES) / SLOT_MINUTES)
      : -1

  const appointmentsByDay = days.reduce((acc, day) => {
    acc[day.format('YYYY-MM-DD')] = []
    return acc
  }, {})

  appointments.forEach((appointment) => {
    if (!appointment?.date) return
    if (!appointmentsByDay[appointment.date]) return

    const placement = buildAppointmentPlacement(appointment)
    if (!placement) return

    appointmentsByDay[appointment.date].push({
      ...appointment,
      placement,
    })
  })

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>Schedule grid</h3>
          <p className={styles.description}>
            {view === 'day'
              ? `Day view for ${formatDateWithWeekday(date)}`
              : `Week view from ${formatDateWithWeekday(from)} to ${formatDateWithWeekday(to)}`}
          </p>
        </div>

        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.scheduled}`}>Scheduled</span>
          <span className={`${styles.legendItem} ${styles.completed}`}>Completed</span>
          <span className={`${styles.legendItem} ${styles.cancelled}`}>Cancelled</span>
        </div>
      </header>

      <div className={styles.gridWrap}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns:
              view === 'day'
                ? '72px minmax(0, 1fr)'
                : `72px repeat(${days.length}, minmax(0, 1fr))`,
            gridTemplateRows: 'auto auto',
          }}
        >
          <div className={styles.corner}>Time</div>
          {days.map((day) => {
            const dayKey = day.format('YYYY-MM-DD')
            const isToday = dayKey === todayKey

            return (
              <div key={dayKey} className={`${styles.dayHeader} ${isToday ? styles.todayHeader : ''}`}>
                <span className={styles.dayLabel}>{day.format('ddd')}</span>
                <span className={styles.dayDate}>{day.format('MMM D')}</span>
              </div>
            )
          })}

          <div
            className={styles.timeColumn}
            style={{
              gridTemplateRows: `repeat(${slotCount}, minmax(54px, 1fr))`,
            }}
          >
            {slots.map((minutes, index) => {
              const isCurrent = index === activeRowIndex
              return (
                <div key={minutes} className={`${styles.timeSlot} ${isCurrent ? styles.currentSlot : ''}`}>
                  <span>{toSlotLabel(minutes)}</span>
                </div>
              )
            })}
          </div>

          {days.map((day) => {
            const dayKey = day.format('YYYY-MM-DD')
            const dayAppointments = appointmentsByDay[dayKey] || []

            return (
              <div
                key={dayKey}
                className={styles.dayColumn}
                style={{
                  gridTemplateRows: `repeat(${slotCount}, minmax(54px, 1fr))`,
                }}
              >
                {slots.map((minutes, index) => {
                  const isCurrent =
                    dayKey === todayKey &&
                    index === activeRowIndex

                  return (
                    <div
                      key={`${dayKey}-${minutes}`}
                      className={`${styles.slot} ${isCurrent ? styles.currentSlot : ''}`}
                    />
                  )
                })}

                {dayAppointments.map((appointment) => {
                  const tone = getStatusTone(appointment.status)
                  const statusLabel = appointment.status || 'Scheduled'

                  return (
                    <article
                      key={appointment.appointment_id}
                      className={`${styles.appointmentCard} ${styles[tone]}`}
                      style={{
                        gridRow: `${appointment.placement.rowStart} / ${appointment.placement.rowEnd}`,
                      }}
                    >
                      <div className={styles.appointmentHeader}>
                        <strong className={styles.cardTitle}>{appointment.customer_name}</strong>
                      </div>

                      <div className={styles.meta}>{appointment.service_name}</div>
                      <div className={styles.meta}>
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </div>
                      <div className={styles.meta}>{appointment.assigned_staff_name}</div>
                      <div className={styles.statusRow}>
                        <span className={styles.statusPill}>{statusLabel}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>Business hours</span>
          <strong>{businessHours?.start || '07:00'} - {businessHours?.end || '22:00'}</strong>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>Appointments in view</span>
          <strong>{appointments.length}</strong>
        </div>
      </footer>
    </section>
  )
}
