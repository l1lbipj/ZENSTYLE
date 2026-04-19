import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import MiniChart from '../../components/dashboard/MiniChart'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatCard from '../../components/dashboard/StatCard'
import businessApi from '../../Api/businessApi'

export default function ReportsPage() {
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    businessApi.reports().then((res) => setPayload(res?.data?.data || null))
  }, [])

  const chartData = useMemo(
    () =>
      (payload?.monthly_revenue || []).map((item) => ({
        label: item.month,
        value: Number(item.total || 0) / 1000000,
      })),
    [payload],
  )

  return (
    <div className="zs-dashboard">
      <PageHeader title="Reports" subtitle="Performance insights across sales, inventory, and feedback." />
      <Section title="Highlights" description="Key business signals this month.">
        <div className="zs-dashboard__row">
          <StatCard title="Revenue Months" value={String((payload?.monthly_revenue || []).length)} delta="Tracked" tone="success" />
          <StatCard title="Inventory Items Used" value={String((payload?.inventory_consumption || []).length)} delta="Top movers" tone="accent" />
          <StatCard title="Wastage Units" value={String(payload?.monthly_wastage_units || 0)} delta="This month" tone="neutral" />
        </div>
      </Section>
      <div className="zs-dashboard__row">
        <Card title="Revenue report" description="Monthly performance">
          <MiniChart data={chartData.length ? chartData : [{ label: 'No data', value: 0 }]} />
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
    </div>
  )
}
