import { useEffect, useState } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import MiniChart from '../../components/dashboard/MiniChart'
import Badge from '../../components/ui/Badge'
import businessApi from '../../Api/businessApi'
import { convertVNDToUSD, formatUSD } from '../../utils/money'
import { formatDateTime } from '../../utils/dateTime'

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

  useEffect(() => {
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
  }, [])

  const metrics = payload?.metrics ?? null
  const appointments = (payload?.upcoming_appointments || []).map((row) => ({
    id: row.appointment_id,
    client: row.client?.client_name || 'Client',
    service:
      row.appointment_details?.[0]?.item?.service_name ||
      row.appointment_details?.[0]?.item?.product_name ||
      'Service',
    time: formatDateTime(row.appointment_date),
    status: row.status === 'active' ? 'Confirmed' : 'Closed',
  }))
  const revenueTrend = [
    { label: 'Today', value: convertVNDToUSD(Number(metrics?.today_revenue || 0)) },
    { label: 'Month', value: convertVNDToUSD(Number(metrics?.month_revenue || 0)) },
    { label: 'Year', value: convertVNDToUSD(Number(metrics?.year_revenue || 0)) },
  ]

  return (
    <div className="zs-dashboard">
      <PageHeader title="Dashboard" subtitle="Snapshot of salon performance today." />
      <Section title="Key metrics" description="Daily performance highlights.">
        <div className="zs-dashboard__row">
          <StatCard title="Appointments Today" value={String(metrics?.appointments_today || 0)} delta="Live" tone="success" icon={<IconCalendar />} />
          <StatCard
            title="Monthly Sales"
            value={formatUSD(Number(metrics?.month_revenue || 0), {
              from: 'VND',
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
            delta="Live"
            tone="success"
            icon={<IconWallet />}
          />
          <StatCard title="Total Staff" value={String(metrics?.total_staff || 0)} delta="Active" tone="neutral" icon={<IconUsers />} />
          <StatCard title="Total Clients" value={String(metrics?.total_clients || 0)} delta="Registered" tone="accent" icon={<IconUserCheck />} />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Revenue trend" description="Daily revenue flow">
          <MiniChart data={revenueTrend} />
        </Card>
        <Card title="Inventory alerts" description="Low stock items to replenish">
          <ul className="zs-list">
            {(payload?.low_stock_products || []).length === 0 ? (
              <li>No low-stock products.</li>
            ) : (
              (payload?.low_stock_products || []).map((item) => (
                <li key={item.product_id}>
                  {item.product_name} - {item.stock_quantity} units
                </li>
              ))
            )}
          </ul>
        </Card>
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
