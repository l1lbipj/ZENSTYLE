import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

function getAppointmentPresentation(item) {
  const details = item.appointment_details || item.appointmentDetails || []
  const firstDetail = details[0]
  const serviceName =
    firstDetail?.item?.service_name ||
    firstDetail?.service?.service_name ||
    firstDetail?.item?.product_name ||
    firstDetail?.product?.product_name ||
    'Service'
  const staffName = firstDetail?.staff?.staff_name || 'TBD'
  const appointmentTime = new Date(item.appointment_date)
  const isUpcoming = appointmentTime > new Date()
  const isClosed = item.status === 'inactive'

  return {
    id: item.appointment_id,
    serviceName,
    staffName,
    timeLabel: formatDateTime(item.appointment_date),
    canReschedule: isUpcoming && !isClosed,
    tone: isClosed ? 'neutral' : isUpcoming ? 'accent' : 'success',
    label: isClosed ? 'Completed / Closed' : isUpcoming ? 'Upcoming' : 'In progress',
  }
}

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const [rescheduleValues, setRescheduleValues] = useState({})
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)

  const loadAppointments = () => {
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
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const mappedAppointments = useMemo(() => appointments.map((item) => getAppointmentPresentation(item)), [appointments])
  const upcomingAppointments = mappedAppointments.filter((item) => item.canReschedule)
  const recentAppointments = mappedAppointments.filter((item) => !item.canReschedule)

  const handleReschedule = async (id) => {
    const value = rescheduleValues[id]
    if (!value) {
      setMessageTone('error')
      setMessage('Please choose a new date and time first.')
      return
    }
    try {
      await businessApi.rescheduleAppointment(id, { appointment_date: value })
      setMessageTone('success')
      setMessage('Appointment rescheduled successfully.')
      loadAppointments()
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.response?.data?.message || 'Reschedule failed.')
    }
  }

  const handleCancel = async (id) => {
    try {
      await businessApi.cancelAppointment(id)
      setMessageTone('success')
      setMessage('Appointment cancelled successfully.')
      loadAppointments()
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.response?.data?.message || 'Cancel failed.')
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My appointments"
        subtitle="View your upcoming visits, adjust the time if needed, and keep track of past bookings."
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
          <h3 style={{ margin: 0 }}>{upcomingAppointments.length}</h3>
        </Card>
        <Card title="Past or closed visits" description="Your appointment history so far.">
          <h3 style={{ margin: 0 }}>{recentAppointments.length}</h3>
        </Card>
      </div>

      <Section title="Upcoming appointments" description="These bookings can still be rescheduled or cancelled.">
        {loading ? <p className="zs-card__description">Loading appointments...</p> : null}
        {!loading && upcomingAppointments.length === 0 ? (
          <Card title="Nothing upcoming" description="You do not have any upcoming appointments right now.">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
              Book your next visit
            </Link>
          </Card>
        ) : null}
        {!loading && upcomingAppointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {upcomingAppointments.map((item) => (
              <Card
                key={item.id}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">Staff: {item.staffName}</p>
                <div className="zs-form">
                  <label className="zs-field">
                    <span className="zs-field__label">Choose a new time</span>
                    <input
                      className="zs-input"
                      type="datetime-local"
                      value={rescheduleValues[item.id] || ''}
                      onChange={(event) => setRescheduleValues((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    />
                  </label>
                  <div className="zs-action-row">
                    <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => handleReschedule(item.id)}>
                      Reschedule
                    </button>
                    <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => handleCancel(item.id)}>
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
        {!loading && recentAppointments.length === 0 ? <p className="zs-card__description">No past appointments yet.</p> : null}
        {!loading && recentAppointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {recentAppointments.map((item) => (
              <Card
                key={item.id}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">Staff: {item.staffName}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  )
}
