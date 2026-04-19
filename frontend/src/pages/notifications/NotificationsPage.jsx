import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import useNotification from '../../hooks/useNotification'
import { formatDateTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

export default function NotificationsPage() {
  const { user } = useAuth()
  const notify = useNotification()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const pageTitle = isAdmin ? 'Admin notifications' : 'Staff notifications'
  const pageSubtitle = isAdmin
    ? 'Review recent appointments and shop order alerts for the salon.'
    : 'Review your assigned appointment notifications and upcoming work items.'

  useEffect(() => {
    let active = true

    const loadNotifications = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await businessApi.notifications()
        if (!active) return

        const data = response?.data?.data || {}
        setAppointments(data.appointments || [])
        setOrders(data.orders || [])
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to load notifications.'
        setError(message)
        notify.error(message)
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    loadNotifications()
    return () => {
      active = false
    }
  }, [notify])

  const summaryItems = useMemo(() => {
    const summary = []
    if (appointments.length > 0) {
      summary.push({ label: 'Appointment alerts', value: String(appointments.length), tone: 'accent' })
    }
    if (isAdmin) {
      summary.push({ label: 'Order alerts', value: String(orders.length), tone: 'success' })
    }
    return summary
  }, [appointments.length, orders.length, isAdmin])

  return (
    <div className="zs-dashboard">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      {error ? <div className="zs-feedback zs-feedback--error" role="status">{error}</div> : null}

      <Section title="Quick summary" description="Current alert counts for your role.">
        <div className="zs-dashboard__row">
          {summaryItems.length > 0 ? (
            summaryItems.map((item) => (
              <Card key={item.label} title={item.label} description={item.value}>
                <Badge tone={item.tone}>{item.value}</Badge>
              </Card>
            ))
          ) : (
            <Card title="No notifications yet" description="You do not have any recent alerts.">
              <p className="zs-card__description">New appointments or order activity will appear here.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title="Appointment alerts" description="Appointments that require your attention.">
        {loading ? <p className="zs-card__description">Loading appointment alerts…</p> : null}
        {!loading && appointments.length === 0 ? (
          <Card title="No appointment alerts" description="No assigned appointments were found." />
        ) : null}
        {!loading && appointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {appointments.map((appointment) => {
              const detail = appointment.appointment_details?.[0] || appointment.appointmentDetails?.[0] || {}
              const serviceName = detail?.item?.service_name || detail?.service?.service_name || detail?.item?.product_name || detail?.product?.product_name || 'Appointment'
              const staffName = detail?.staff?.staff_name || 'TBD'
              return (
                <Card
                  key={appointment.appointment_id}
                  title={`Appointment #${appointment.appointment_id}`}
                  description={formatDateTime(appointment.appointment_date)}
                  actions={<Badge tone={appointment.status === 'inactive' ? 'neutral' : 'accent'}>{appointment.status || 'active'}</Badge>}
                >
                  <p className="zs-card__description">Service: {serviceName}</p>
                  <p className="zs-card__description">Client: {appointment.client?.client_name || appointment.client?.name || 'Unknown'}</p>
                  <p className="zs-card__description">Staff: {staffName}</p>
                </Card>
              )
            })}
          </div>
        ) : null}
      </Section>

      {isAdmin ? (
        <Section title="Order alerts" description="Recent shop orders for the admin dashboard.">
          {!loading && orders.length === 0 ? (
            <Card title="No order alerts" description="No recent shop orders were found." />
          ) : null}
          {!loading && orders.length > 0 ? (
            <div className="zs-dashboard__row">
              {orders.map((order) => (
                <Card
                  key={order.shop_order_id}
                  title={`Order #${order.shop_order_id}`}
                  description={`Total ${formatUSD(Number(order.total_amount || 0), { from: 'VND' })}`}
                  actions={<Badge tone={order.status === 'pending' ? 'accent' : 'success'}>{order.status || 'pending'}</Badge>}
                >
                  <p className="zs-card__description">Customer: {order.customer_name || 'Unknown'}</p>
                  <p className="zs-card__description">Payment: {order.payment_method?.toUpperCase() || 'COD'}</p>
                  <p className="zs-card__description">Items: {order.items?.length || 0}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  )
}
