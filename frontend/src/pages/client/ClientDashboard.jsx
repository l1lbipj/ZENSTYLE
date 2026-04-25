import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import MiniChart from '../../components/dashboard/MiniChart'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import CalendarView from '../../components/calendar/CalendarView'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime, formatTime } from '../../utils/dateTime'

function flattenBusyItems(appointments = []) {
  return appointments.flatMap((appointment) => {
    const appointmentDate = appointment?.appointment_date
    const details = appointment?.appointment_details || appointment?.appointmentDetails || []

    if (!appointmentDate || !Array.isArray(details) || details.length === 0) {
      return appointmentDate
        ? [{
            appointment_id: appointment?.appointment_id,
            appointment_date: appointmentDate,
            label: 'Appointment',
            service_name: 'Appointment',
            staff_name: '--',
            start_time: appointmentDate,
            end_time: appointmentDate,
            status: appointment?.status || 'active',
          }]
        : []
    }

    return details.map((detail, index) => ({
      key: `${appointment.appointment_id}-${detail.detail_id || detail.service_id || index}`,
      appointment_id: appointment?.appointment_id,
      appointment_date: appointmentDate,
      start_time: detail.start_time,
      end_time: detail.end_time,
      check_in: detail.started_at,
      check_out: detail.completed_at,
      label: detail?.service?.service_name || detail.service_name || 'Service',
      service_name: detail?.service?.service_name || detail.service_name || 'Service',
      staff_name: detail?.staff?.staff_name || '--',
      payment_status: appointment?.payment_status || 'unpay',
      status: appointment?.status || 'active',
      appointment: {
        appointment_date: appointmentDate,
        start_time: detail.start_time,
        end_time: detail.end_time,
        service_name: detail?.service?.service_name || detail.service_name || 'Service',
      },
    }))
  })
}

export default function ClientDashboard() {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBusyItem, setSelectedBusyItem] = useState(null)
  const [selectedBusyGroup, setSelectedBusyGroup] = useState([])

  useEffect(() => {
    let mounted = true
    businessApi
      .dashboardClient()
      .then((res) => {
        if (!mounted) return
        setPayload(res?.data?.data || null)
      })
      .catch(() => {
        if (!mounted) return
        setPayload(null)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const metrics = payload?.metrics || {}
  const chartData = useMemo(
    () =>
      (payload?.favorite_services || []).map((item) => ({
        label: item.service_name,
        value: Number(item.usage_count || 0),
      })),
    [payload],
  )
  const busyItems = useMemo(() => flattenBusyItems(payload?.upcoming_appointments || []), [payload?.upcoming_appointments])

  const handleBusyItemClick = (item, group = []) => {
    setSelectedBusyItem(item || null)
    setSelectedBusyGroup(group || [])
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Your ZenStyle space"
        subtitle="Check your next visit, rewards, and favorite services in one place."
        action={
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book a new appointment
          </Link>
        }
      />
      <Section title="Your highlights" description="A quick snapshot of your account.">
        <div className="zs-dashboard__row">
          <StatCard title="Upcoming visits" value={String(metrics.upcoming_visits || 0)} delta="Appointments ahead" tone="accent" />
          <StatCard title="Reward points" value={String(metrics.reward_points || 0)} delta="Your current balance" tone="success" />
          <StatCard title="Past visits" value={String(metrics.history_count || 0)} delta="Completed appointments" tone="neutral" />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Favorite services" description="The treatments you come back to most often.">
          <MiniChart data={chartData.length ? chartData : [{ label: 'No data', value: 0 }]} />
        </Card>
        <Card
          title="Upcoming appointment"
          description="Your next confirmed booking."
          actions={
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
              View all
            </Link>
          }
        >
          {loading ? <p className="zs-card__description">Loading upcoming appointments...</p> : null}
          {!loading && (payload?.upcoming_appointments || []).length === 0 ? (
            <p className="zs-card__description">You do not have any upcoming appointments yet.</p>
          ) : null}
          {!loading &&
            (payload?.upcoming_appointments || []).slice(0, 2).map((item) => (
                <div key={item.appointment_id} className="zs-task">
                  <div>
                  <h4>{item.appointment_details?.[0]?.service?.service_name || 'Service'}</h4>
                  <p>{formatDateTime(item.appointment_date)}</p>
                </div>
                <span className="zs-badge zs-badge--accent">{item.status}</span>
              </div>
            ))}
        </Card>
      </div>
      <Section title="Weekly view" description="A simple look at your upcoming booking schedule.">
        <CalendarView title="This week" busyItems={busyItems} onBusyItemClick={handleBusyItemClick} />
      </Section>

      <Modal
        open={!!selectedBusyItem}
        title={selectedBusyItem ? `Appointment details` : 'Appointment details'}
        onClose={() => setSelectedBusyItem(null)}
      >
        {selectedBusyItem ? (
          <div className="zs-form">
            <Card title={selectedBusyItem.service_name || 'Service'} description="Your upcoming visit">
              <p className="zs-card__description">
                Date: <strong>{formatDateTime(selectedBusyItem.appointment_date)}</strong>
              </p>
              <p className="zs-card__description">
                Start: <strong>{formatTime(selectedBusyItem.start_time || selectedBusyItem.appointment_date)}</strong>
              </p>
              <p className="zs-card__description">
                Staff: <strong>{selectedBusyItem.staff_name || '--'}</strong>
              </p>
              <p className="zs-card__description">
                Payment: <strong>{selectedBusyItem.payment_status || 'unpay'}</strong>
              </p>
              <p className="zs-card__description">
                Status: <strong>{selectedBusyItem.status || 'active'}</strong>
              </p>
              {selectedBusyGroup.length > 1 ? (
                <p className="zs-card__description">This slot contains {selectedBusyGroup.length} overlapping items.</p>
              ) : null}
            </Card>
            <div className="zs-action-row">
              <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/appointments">
                View all appointments
              </Link>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setSelectedBusyItem(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
