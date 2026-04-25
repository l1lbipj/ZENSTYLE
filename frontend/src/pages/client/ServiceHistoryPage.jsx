import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

function getAppointmentName(appointment) {
  const detail = appointment?.appointment_details?.[0] || appointment?.appointmentDetails?.[0] || {}
  return (
    detail?.service?.service_name ||
    'Service'
  )
}

function getPaymentTone(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'paid' || normalized === 'completed' || normalized === 'approved') return 'success'
  if (normalized === 'pending') return 'warning'
  if (normalized === 'refunded') return 'accent'
  if (normalized === 'failed') return 'neutral'
  return 'neutral'
}

export default function ServiceHistoryPage() {
  const [appointments, setAppointments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    Promise.allSettled([
      businessApi.clientHistory({ per_page: 20 }),
      businessApi.clientPayments({}),
    ])
      .then(([historyRes, paymentRes]) => {
        if (!mounted) return

        const historyList = historyRes.status === 'fulfilled' ? historyRes.value?.data?.data?.data || [] : []
        const paymentList = paymentRes.status === 'fulfilled' ? paymentRes.value?.data?.data || [] : []

        setAppointments(historyList)
        setInvoices(paymentList)
        if (historyRes.status === 'rejected' && paymentRes.status === 'rejected') {
          throw historyRes.reason || paymentRes.reason
        }
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load service history.')
        setAppointments([])
        setInvoices([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const completedCount = useMemo(() => appointments.length, [appointments])
  const invoiceCount = useMemo(() => invoices.length, [invoices])

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Service history"
        subtitle="Look back at your past appointments and appointment invoices."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/feedback">
            Leave feedback
          </Link>
        }
      />

      <div className="zs-dashboard__row">
        <Card title="Completed visits" description="Your finished appointments so far.">
          <h3 style={{ margin: 0 }}>{completedCount}</h3>
        </Card>
        <Card title="Appointment orders" description="Payments for services and appointment invoices.">
          <h3 style={{ margin: 0 }}>{invoiceCount}</h3>
        </Card>
        <Card title="Next step" description="Book again whenever you are ready for your next visit.">
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book again
          </Link>
        </Card>
      </div>

      <Section title="Service history" description="Your most recent appointments appear here.">
        {loading ? <p className="zs-card__description">Loading service history...</p> : null}
        {!loading && error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}
        {!loading && !error && appointments.length === 0 ? (
          <Card title="No service history yet" description="Your completed visits will show up here after your first appointment." />
        ) : null}
        {!loading && !error && appointments.length > 0 ? (
          <div className="zs-dashboard__row">
            {appointments.map((appointment) => (
              <Card
                key={appointment.appointment_id}
                title={getAppointmentName(appointment)}
                description={formatDateTime(appointment.appointment_date)}
                actions={<Badge tone="success">{appointment.status || 'completed'}</Badge>}
              >
                <p className="zs-card__description">
                  {appointment.feedback?.rating ? `Your rating: ${appointment.feedback.rating}/5` : 'No feedback submitted yet.'}
                </p>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Payment & Invoice History" description="Linked invoices for appointments and appointment orders.">
        {!loading && invoices.length === 0 ? (
          <Card title="No invoice history yet" description="Paid and pending invoices will appear here automatically." />
        ) : null}
        {!loading && invoices.length > 0 ? (
          <div className="zs-table zs-table--compact zs-payment-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Service / Product</th>
                  <th>Total amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Payment date</th>
                  <th>Related appointment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={`${row.invoice_type}-${row.invoice_id}`}>
                    <td>{row.invoice_id}</td>
                    <td>{row.item_name}</td>
                    <td>{formatUSD(Number(row.total_amount || 0), { from: 'USD' })}</td>
                    <td>
                      <Badge tone={getPaymentTone(row.payment_status)}>{row.payment_status}</Badge>
                    </td>
                    <td>{row.payment_method || 'Cash'}</td>
                    <td>{formatDateTime(row.payment_date)}</td>
                    <td>{row.related_appointment ? formatDateTime(row.related_appointment) : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>
    </div>
  )
}
