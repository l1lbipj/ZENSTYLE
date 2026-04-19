import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

export default function ServiceHistoryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    businessApi
      .clientHistory({ per_page: 20 })
      .then((res) => {
        if (!mounted) return
        const list = res?.data?.data?.data || []
        setRows(
          list.map((appt) => {
            const detail = appt.appointment_details?.[0]
            const name = detail?.item?.service_name || detail?.item?.product_name || 'Service'
            return `${formatDateTime(appt.appointment_date)} - ${name}`
          }),
        )
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Unable to load service history.')
        setRows([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card title="Service history" description="Your recent appointments and packages.">
      <ul className="zs-list">
        {loading ? <li>Loading service history...</li> : null}
        {!loading && error ? <li>{error}</li> : null}
        {!loading && !error && rows.length === 0 ? <li>No data available.</li> : null}
        {!loading && !error ? rows.map((row) => <li key={row}>{row}</li>) : null}
      </ul>
    </Card>
  )
}
