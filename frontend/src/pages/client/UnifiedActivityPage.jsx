import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import useNotification from '../../hooks/useNotification'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

function getAppointmentPresentation(item) {
  const details = item.appointment_details || item.appointmentDetails || []
  const firstDetail = details[0]
  const serviceName =
    firstDetail?.service?.service_name ||
    'Service'
  const staffName = firstDetail?.staff?.staff_name || 'TBD'
  const appointmentTime = new Date(item.appointment_date)
  const isUpcoming = appointmentTime > new Date()
  const isClosed = item.status === 'inactive'

  return {
    id: item.appointment_id,
    type: 'appointment',
    timestamp: new Date(item.appointment_date || item.created_at || Date.now()).getTime(),
    serviceName,
    staffName,
    timeLabel: formatDateTime(item.appointment_date),
    amount: Number(item.final_amount || item.total_amount || 0),
    paymentStatus: item.payment_status || 'unpay',
    canReschedule: isUpcoming && !isClosed,
    tone: isClosed ? 'neutral' : isUpcoming ? 'accent' : 'success',
    label: isClosed ? 'Completed / Closed' : isUpcoming ? 'Upcoming' : 'In progress',
  }
}

function getAppointmentOrderPresentation(item) {
  const orderTime = new Date(item.payment_date || item.updated_at || item.created_at || Date.now())
  const status = String(item.payment_status || 'Pending')
  const invoiceType = String(item.invoice_type || 'appointment_order')

  return {
    id: item.invoice_id,
    type: 'appointment_order',
    timestamp: orderTime.getTime(),
    serviceName: item.item_name || `Appointment order #${item.invoice_id}`,
    staffName: invoiceType === 'appointment_order' ? 'Appointment invoice' : 'Service invoice',
    timeLabel: formatDateTime(item.payment_date || item.updated_at || item.created_at || new Date()),
    amount: Number(item.total_amount || 0),
    paymentStatus: item.payment_method || 'cash',
    canReschedule: false,
    tone: String(status).toLowerCase() === 'paid' ? 'success' : String(status).toLowerCase() === 'pending' ? 'warning' : 'neutral',
    label: invoiceType === 'appointment_order' ? 'Appointment order' : invoiceType,
  }
}

export default function ClientDashboard() {
  const notify = useNotification()
  const [appointments, setAppointments] = useState([])
  const [appointmentOrders, setAppointmentOrders] = useState([])
  const [error, setError] = useState('')
  const [rescheduleValues, setRescheduleValues] = useState({})
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [appointmentsRes, paymentsRes] = await Promise.all([
        businessApi.appointments({ per_page: 50 }),
        businessApi.clientPayments({}),
      ])

      setAppointments(appointmentsRes?.data?.data?.data || [])
      setAppointmentOrders((paymentsRes?.data?.data || []).filter((row) => row.invoice_type === 'appointment_order'))
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load data.'
      setError(msg)
      notify.error(msg)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadData()
  }, [loadData])

  const mappedAppointments = useMemo(
    () => appointments.map((item) => getAppointmentPresentation(item)),
    [appointments],
  )
  
  const mappedOrders = useMemo(
    () => appointmentOrders.map((item) => getAppointmentOrderPresentation(item)),
    [appointmentOrders],
  )

  const allActivities = useMemo(
    () => [...mappedAppointments, ...mappedOrders].sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0)
    }),
    [mappedAppointments, mappedOrders],
  )

  const upcomingAppointments = mappedAppointments.filter((item) => item.canReschedule)
  const recentAppointments = mappedAppointments.filter((item) => !item.canReschedule)
  const recentOrders = mappedOrders.slice(0, 5)

  const handleReschedule = async (id) => {
    const value = rescheduleValues[id]
    if (!value) {
      notify.warning('Please choose a new date and time first.')
      return
    }
    try {
      await businessApi.rescheduleAppointment(id, { appointment_date: value })
      notify.success('Appointment rescheduled successfully.')
      await loadData()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Reschedule failed.'
      notify.error(msg)
    }
  }

  const handleCancel = async (id) => {
    try {
      await businessApi.cancelAppointment(id)
      notify.success('Appointment cancelled successfully.')
      await loadData()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Cancel failed.'
      notify.error(msg)
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My services & orders"
        subtitle="Track your appointments and appointment-order history in one place."
        action={
          <div className="zs-action-row">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
              Book appointment
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/history">
              View history
            </Link>
          </div>
        }
      />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Upcoming appointments" description="Visits you have scheduled.">
          <h3 style={{ margin: 0 }}>{upcomingAppointments.length}</h3>
        </Card>
        <Card title="Appointment orders" description="Your recent paid appointment invoices.">
          <h3 style={{ margin: 0 }}>{appointmentOrders.length}</h3>
        </Card>
        <Card title="Total spent" description="Combined appointments and appointment orders.">
          <h3 style={{ margin: 0 }}>
            {formatUSD(
              (mappedAppointments.reduce((sum, a) => sum + a.amount, 0) +
                mappedOrders.reduce((sum, o) => sum + o.amount, 0)),
              { from: 'USD' },
            )}
          </h3>
        </Card>
      </div>

      <Section title="All activities" description="Your appointments and appointment orders in chronological order.">
        {loading ? <p className="zs-card__description">Loading your activities...</p> : null}

        {!loading && allActivities.length === 0 ? (
          <Card title="No activities yet" description="Start by booking an appointment.">
            <div className="zs-action-row">
              <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
                Book now
              </Link>
            </div>
          </Card>
        ) : null}

        {!loading && allActivities.length > 0 ? (
          <div className="zs-dashboard__row">
            {allActivities.slice(0, 6).map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">
                  {item.type === 'appointment' ? `Staff: ${item.staffName}` : item.staffName}
                </p>
                <p className="zs-card__description" style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                  {formatUSD(item.amount, { from: 'USD' })}
                </p>

                {item.type === 'appointment' && item.canReschedule && (
                  <div className="zs-form">
                    <label className="zs-field">
                      <span className="zs-field__label">Choose a new time</span>
                      <input
                        className="zs-input"
                        type="datetime-local"
                        value={rescheduleValues[item.id] || ''}
                        onChange={(event) =>
                          setRescheduleValues((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                      />
                    </label>
                    <div className="zs-action-row">
                      <button
                        type="button"
                        className="zs-btn zs-btn--ghost zs-btn--sm"
                        onClick={() => handleReschedule(item.id)}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="zs-btn zs-btn--ghost zs-btn--sm"
                        onClick={() => handleCancel(item.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {item.type === 'appointment_order' && (
                  <div className="zs-action-row" style={{ marginTop: '0.5rem' }}>
                    <Link
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      to="/client/history"
                    >
                      View history
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : null}
      </Section>

      {!loading && upcomingAppointments.length > 0 && (
        <Section title="Manage upcoming appointments" description="Reschedule or cancel your bookings.">
          <div className="zs-dashboard__row">
            {upcomingAppointments.map((item) => (
              <Card
                key={item.id}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">Staff: {item.staffName}</p>
                <p className="zs-card__description" style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                  {formatUSD(item.amount, { from: 'USD' })}
                </p>
                <div className="zs-form">
                  <label className="zs-field">
                    <span className="zs-field__label">Choose a new time</span>
                    <input
                      className="zs-input"
                      type="datetime-local"
                      value={rescheduleValues[item.id] || ''}
                      onChange={(event) =>
                        setRescheduleValues((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                    />
                  </label>
                  <div className="zs-action-row">
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleReschedule(item.id)}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="zs-btn zs-btn--ghost zs-btn--sm"
                      onClick={() => handleCancel(item.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {!loading && recentOrders.length > 0 && (
        <Section title="Recent appointment orders" description="Your latest paid appointment invoices.">
          <div className="zs-dashboard__row">
            {recentOrders.map((item) => (
              <Card
                key={item.id}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">{item.staffName}</p>
                <p className="zs-card__description" style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                  {formatUSD(item.amount, { from: 'USD' })}
                </p>
                <div className="zs-action-row" style={{ marginTop: '0.5rem' }}>
                  <Link
                    className="zs-btn zs-btn--ghost zs-btn--sm"
                    to="/client/history"
                  >
                    View history
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {!loading && recentAppointments.length > 0 && (
        <Section title="Appointment history" description="A look back at your past visits.">
          <div className="zs-dashboard__row">
            {recentAppointments.slice(0, 6).map((item) => (
              <Card
                key={item.id}
                title={item.serviceName}
                description={item.timeLabel}
                actions={<Badge tone={item.tone}>{item.label}</Badge>}
              >
                <p className="zs-card__description">Staff: {item.staffName}</p>
                <p className="zs-card__description" style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                  {formatUSD(item.amount, { from: 'USD' })}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
