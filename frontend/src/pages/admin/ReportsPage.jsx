import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import MiniChart from '../../components/dashboard/MiniChart'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatCard from '../../components/dashboard/StatCard'
import businessApi from '../../Api/businessApi'
import Button from '../../components/ui/Button'

export default function ReportsPage() {
  const [payload, setPayload] = useState(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    businessApi.reports({ from, to }).then((res) => setPayload(res?.data?.data || null))
  }, [from, to])

  const chartData = useMemo(
    () =>
      (payload?.monthly_revenue || []).map((item) => ({
        label: item.month,
        value: Number(item.total || 0) / 1000000,
        displayValue: `$${Number(item.total || 0).toLocaleString()}`,
      })),
    [payload],
  )

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Reports"
        subtitle="Performance insights across sales, inventory, and feedback."
        action={
          <div className="zs-action-row">
            <input className="zs-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="zs-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        }
      />
      <Section title="Highlights" description="Key business signals this month.">
        <div className="zs-dashboard__row">
          <StatCard title="Revenue Months" value={String((payload?.monthly_revenue || []).length)} delta="Tracked" tone="success" />
          <StatCard title="Inventory Items Used" value={String((payload?.inventory_consumption || []).length)} delta="Top movers" tone="accent" />
          <StatCard title="Wastage Units" value={String(payload?.monthly_wastage_units || 0)} delta="This month" tone="neutral" />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Revenue report" description="Monthly performance">
          {chartData.length > 0 ? (
            <MiniChart data={chartData} />
          ) : (
            <p className="zs-card__description">No real revenue data in this range.</p>
          )}
        </Card>
        <Card title="Inventory usage" description="Top moving items">
          <ul className="zs-list">
            {(payload?.inventory_consumption || []).map((item) => (
              <li key={item.product_name}>
                {item.product_name} - {item.consumed} units
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Section
        title="Export"
        description="Download the current report view for meetings or audit trails."
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const rows = [
                ['month', 'total'],
                ...((payload?.monthly_revenue || []).map((row) => [row.month, row.total])),
              ]
              const csv = rows.map((row) => row.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'zenstyle-reports.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export CSV
          </Button>
        }
      >
        <Card title="Current range" description="The report is filtered by your selected dates.">
          <p className="zs-card__description">
            {payload?.from ? new Date(payload.from).toLocaleDateString() : 'Default start'} - {payload?.to ? new Date(payload.to).toLocaleDateString() : 'Today'}
          </p>
        </Card>
      </Section>
    </div>
  )
}
