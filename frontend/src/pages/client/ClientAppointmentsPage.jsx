import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

const CHECK_IN_OPEN_MINUTES_BEFORE = 60
const CHECK_IN_CLOSE_MINUTES_BEFORE = 30

function asDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getServiceNames(details) {
  return details
    .map((detail) => detail?.service?.service_name)
    .filter(Boolean)
}

function getAppointmentPresentation(item) {
  const details = item.appointment_details || item.appointmentDetails || []
  const serviceNames = getServiceNames(details)
  const appointmentDate = asDate(item.appointment_date)
  const attendanceStatus = item.attendance_status || 'Pending'
  const isActive = item.status === 'active'
  const isCancelled = attendanceStatus === 'Cancelled'
  const isCompleted = attendanceStatus === 'Completed'
  const isMissed = attendanceStatus === 'Missed'
  const canCheckIn = Boolean(item.can_check_in) || false
  const canCheckOut = Boolean(item.can_check_out) || false
  const canManage = isActive && attendanceStatus === 'Pending'

  return {
    id: item.appointment_id,
    serviceName: serviceNames[0] || 'Service',
    serviceSummary: serviceNames.length > 0 ? serviceNames.join(', ') : 'Service',
    staffName: details[0]?.staff?.staff_name || 'TBD',
    timeLabel: formatDateTime(item.appointment_date),
    appointmentDate,
    attendanceStatus,
    statusLabel: isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : isMissed ? 'Missed' : canCheckIn ? 'Ready for check-in' : canCheckOut ? 'In progress' : 'Pending',
    tone: isCancelled ? 'neutral' : isCompleted ? 'success' : isMissed ? 'warning' : canCheckIn ? 'accent' : canCheckOut ? 'warning' : 'neutral',
    canCheckIn,
    canCheckOut,
    canManage,
    isActive,
  }
}

function isWithinClientWindow(appointmentDate) {
  if (!appointmentDate) return false
  const now = new Date()
  const windowOpen = new Date(appointmentDate.getTime() - CHECK_IN_OPEN_MINUTES_BEFORE * 60 * 1000)
  const windowClose = new Date(appointmentDate.getTime() - CHECK_IN_CLOSE_MINUTES_BEFORE * 60 * 1000)
  return now >= windowOpen && now <= windowClose
}

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const [rescheduleValues, setRescheduleValues] = useState({})
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)
  const [actionState, setActionState] = useState({ id: null, type: null })

  const loadAppointments = useCallback(() => {
    setLoading(true)
    businessApi
      .appointments({ per_page: 50 })
      .then((res) => {
        setAppointments(res?.data?.data?.data || [])
        setError('')
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load appointments.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadAppointments])

  const mappedAppointments = useMemo(
    () =>
      appointments.map((item) => {
        const presentation = getAppointmentPresentation(item)
        return {
          ...presentation,
          raw: item,
          canCheckIn: presentation.canCheckIn || (item.status === 'active' && presentation.attendanceStatus === 'Pending' && isWithinClientWindow(presentation.appointmentDate)),
          canCheckOut: presentation.canCheckOut || presentation.attendanceStatus === 'Checked-In',
        }
      }),
    [appointments],
  )

  const activeAppointments = mappedAppointments.filter(
    (item) => item.isActive && ['Pending', 'Checked-In'].includes(item.attendanceStatus),
  )
  const pastAppointments = mappedAppointments.filter(
    (item) => !item.isActive || ['Completed', 'Cancelled', 'Missed'].includes(item.attendanceStatus),
  )

  const performAction = async (id, type, action, successMessage) => {
    setActionState({ id, type })
    try {
      await action(id)
      setMessageTone('success')
      setMessage(successMessage)
      loadAppointments()
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.response?.data?.message || `${type} failed.`)
    } finally {
      setActionState({ id: null, type: null })
    }
  }

  const handleReschedule = async (id) => {
    const value = rescheduleValues[id]
    if (!value) {
      setMessageTone('error')
      setMessage('Please choose a new date and time first.')
      return
    }

    await performAction(id, 'reschedule', (appointmentId) => businessApi.rescheduleAppointment(appointmentId, { appointment_date: value }), 'Appointment rescheduled successfully.')
  }

  const handleCancel = async (id) => {
    await performAction(id, 'cancel', (appointmentId) => businessApi.cancelAppointment(appointmentId), 'Appointment cancelled successfully.')
  }

  const handleCheckIn = async (id) => {
    await performAction(id, 'check-in', (appointmentId) => businessApi.checkInAppointment(appointmentId), 'Check-in completed successfully.')
  }

  const handleCheckOut = async (id) => {
    await performAction(id, 'check-out', (appointmentId) => businessApi.checkOutAppointment(appointmentId), 'Check-out completed successfully.')
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My appointments"
        subtitle="Track upcoming visits, check in at the right time, and review your appointment history."
        action={
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book appointment
          </Link>
        }
      />

      {message ? <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div> : null}
      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Upcoming bookings" description="Appointments you can still manage.">
          <h3 style={{ margin: 0 }}>{activeAppointments.length}</h3>
        </Card>
        <Card title="Past or closed visits" description="Your appointment history so far.">
          <h3 style={{ margin: 0 }}>{pastAppointments.length}</h3>
        </Card>
      </div>

      <Section title="Upcoming appointments" description="Check in within the allowed window, or cancel/reschedule while the visit is still pending.">
        {loading ? <p className="zs-card__description">Loading appointments...</p> : null}
        {!loading && activeAppointments.length === 0 ? (
          <Card title="Nothing upcoming" description="You do not have any upcoming appointments right now.">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
              Book your next visit
            </Link>
          </Card>
        ) : null}
        {!loading && activeAppointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {activeAppointments.map((item) => (
              <Card
                key={item.id}
                title={item.serviceSummary}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.statusLabel}</Badge>}
              >
                <p className="zs-card__description">Service: {item.serviceName}</p>
                <p className="zs-card__description">Staff: {item.staffName}</p>
                <p className="zs-card__description">Attendance: {item.attendanceStatus}</p>
                <div className="zs-form">
                  <label className="zs-field">
                    <span className="zs-field__label">Choose a new time</span>
                    <input
                      className="zs-input"
                      type="datetime-local"
                      value={rescheduleValues[item.id] || ''}
                      onChange={(event) => setRescheduleValues((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      disabled={!item.canManage}
                    />
                  </label>
                  <div className="zs-action-row" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleCheckIn(item.id)}
                      disabled={!item.canCheckIn || actionState.id === item.id}
                    >
                      {actionState.id === item.id && actionState.type === 'check-in' ? 'Checking in...' : 'Check In'}
                    </button>
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleCheckOut(item.id)}
                      disabled={!item.canCheckOut || actionState.id === item.id}
                    >
                      {actionState.id === item.id && actionState.type === 'check-out' ? 'Checking out...' : 'Check Out'}
                    </button>
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleReschedule(item.id)}
                      disabled={!item.canManage || actionState.id === item.id}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleCancel(item.id)}
                      disabled={!item.canManage || actionState.id === item.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Recent appointments" description="A quick look back at your appointment history.">
        {!loading && pastAppointments.length === 0 ? <p className="zs-card__description">No past appointments yet.</p> : null}
        {!loading && pastAppointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {pastAppointments.map((item) => (
              <Card
                key={item.id}
                title={item.serviceSummary}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.statusLabel}</Badge>}
              >
                <p className="zs-card__description">Service: {item.serviceName}</p>
                <p className="zs-card__description">Staff: {item.staffName}</p>
                <p className="zs-card__description">Attendance: {item.attendanceStatus}</p>
                <div className="zs-action-row" style={{ flexWrap: 'wrap' }}>
                  <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" disabled>
                    Check In
                  </button>
                  <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" disabled>
                    Check Out
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  )
}
