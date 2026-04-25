import { useEffect, useState } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import businessApi from '../../Api/businessApi'
import { formatUSD } from '../../utils/money'
import { formatDateTime } from '../../utils/dateTime'
import RevenueAnalyticsCard from '../../components/dashboard/RevenueAnalyticsCard'

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="9" width="4" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <g fill="currentColor">
        <circle cx="7.5" cy="8" r="2.5" />
        <circle cx="16.5" cy="8" r="2.5" />
        <path d="M3 18c0-1.7 4-3 9-3s9 1.3 9 3v1H3v-1z" />
      </g>
    </svg>
  )
}

function IconUserCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <g fill="currentColor">
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3 19c0-2 3.6-3.5 7-3.5s7 1.5 7 3.5v1H3v-1z" />
        <path d="M17.5 10.5l1.8 1.8 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  )
}

export default function AdminDashboard() {
  const [payload, setPayload] = useState(null)
  const [actionError, setActionError] = useState('')

  const loadDashboard = () => {
    let mounted = true
    businessApi
      .dashboardAdmin()
      .then((res) => {
        if (!mounted) return
        setPayload(res?.data?.data || null)
      })
      .catch(() => {
        if (!mounted) return
        setPayload(null)
      })
    return () => {
      mounted = false
    }
  }

  useEffect(() => {
    const cleanup = loadDashboard()
    return cleanup
  }, [])

  const refreshDashboard = async () => {
    const res = await businessApi.dashboardAdmin()
    setPayload(res?.data?.data || null)
  }

  const approveAppointment = async (id) => {
    setActionError('')
    try {
      await businessApi.approveAppointment(id)
      await refreshDashboard()
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to approve appointment.')
    }
  }

  const cancelAppointment = async (id) => {
    setActionError('')
    try {
      await businessApi.cancelAppointmentAdmin(id)
      await refreshDashboard()
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to cancel appointment.')
    }
  }

  const metrics = payload?.metrics ?? null
  const appointments = (payload?.upcoming_appointments || []).map((row) => ({
    id: row.appointment_id,
    client: row.client?.client_name || 'Client',
    service:
      row.appointment_details?.[0]?.service?.service_name ||
      'Service',
    time: formatDateTime(row.appointment_date),
    status: row.status === 'active' ? (row.payment_status === 'pay' ? 'Approved' : 'Pending approval') : 'Closed',
    canApprove: row.status === 'active' && row.payment_status !== 'pay',
    canCancel: row.status === 'active' && row.payment_status !== 'pay',
  }))
  return (
    <div className="zs-dashboard">
      <PageHeader title="Dashboard" subtitle="Snapshot of salon performance today." />
      {actionError ? <div className="zs-feedback zs-feedback--error">{actionError}</div> : null}
      <Section title="Key metrics" description="Daily performance highlights.">
        <div className="zs-dashboard__row zs-dashboard__row--metrics">
          <StatCard title="Appointments Today" value={String(metrics?.appointments_today || 0)} delta="Today" tone="success" icon={<IconCalendar />} />
          <StatCard
            title="Today Revenue"
            value={formatUSD(Number(metrics?.today_revenue || 0), {
              from: 'USD',
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
            delta="Live"
            tone="success"
            icon={<IconWallet />}
          />
          <StatCard title="Total Staff" value={String(metrics?.total_staff || 0)} delta="Active" tone="neutral" icon={<IconUsers />} />
          <StatCard title="Total Clients" value={String(metrics?.total_clients || 0)} delta="Live" tone="accent" icon={<IconUserCheck />} />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <RevenueAnalyticsCard />
      </div>
      <Section title="Upcoming appointments" description="Front desk pipeline for today.">
        <div className="zs-table zs-table--compact">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4}>No data available.</td>
                </tr>
              ) : (
                appointments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.client}</td>
                    <td>{row.service}</td>
                    <td>{row.time}</td>
                    <td>
                      <Badge tone={row.status === 'Closed' ? 'neutral' : 'success'}>{row.status}</Badge>
                    </td>
                    <td>
                      <div className="zs-table__actions">
                        {row.canApprove ? (
                          <button type="button" className="zs-btn zs-btn--primary zs-btn--sm" onClick={() => approveAppointment(row.id)}>
                            Approve
                          </button>
                        ) : null}
                        {row.canCancel ? (
                          <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => cancelAppointment(row.id)}>
                            Cancel
                          </button>
                        ) : null}
                        {!row.canApprove && !row.canCancel ? <span className="zs-card__description">No actions</span> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
