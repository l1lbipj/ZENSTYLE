import { useMemo, useState, useEffect } from 'react'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'
import AppointmentTable from '../../components/staff/AppointmentTable'
import styles from './StaffPages.module.css'

const PAGE_SIZE = 8

function mapStatus(appointment) {
  const appointmentStatus = appointment?.status
  const paymentStatus = appointment?.payment_status

  if (appointmentStatus === 'cancelled') return 'cancelled'
  if (appointmentStatus === 'inactive') {
    return paymentStatus === 'pay' ? 'completed' : 'cancelled'
  }
  return 'pending'
}

function isServiceDetail(detail) {
  return detail?.item_type === 'service' || Boolean(detail?.service_id || detail?.service)
}

function getServiceName(detail) {
  return detail?.item?.service_name || detail?.service?.service_name || 'Service'
}

export default function StaffTasksPage() {
  const [filter, setFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const loadAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await businessApi.staffAppointments({ per_page: 100 })
      const rows = res?.data?.data?.data || res?.data?.data || []
      const details = []

      rows.forEach((appointment) => {
        const appointmentDetails = appointment?.appointment_details || appointment?.appointmentDetails || []
        appointmentDetails.forEach((detail) => {
          if (!isServiceDetail(detail)) return
          details.push({
            id: detail?.detail_id,
            customerName: appointment?.client?.client_name || 'Customer',
            phone: appointment?.client?.phone || '-',
            serviceName: getServiceName(detail),
            datetime: appointment?.appointment_date,
            status: mapStatus(appointment),
          })
        })
      })

      details.sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0))
      setAppointments(details)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load appointment history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const visibleAppointments = useMemo(() => {
    if (filter === 'all') return appointments
    return appointments.filter((item) => item.status === filter)
  }, [appointments, filter])

  const pagedAppointments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visibleAppointments.slice(start, start + PAGE_SIZE)
  }, [visibleAppointments, page])

  const totalPages = Math.max(1, Math.ceil(visibleAppointments.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [filter])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Appointment history</h2>
          <p className={styles.subtitle}>Review services you handled with customer details.</p>
        </header>

        <AppointmentTable
          title="Service records"
          description="Sorted by latest appointment time."
          filters={[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ]}
          activeFilter={filter}
          onFilterChange={setFilter}
          loading={loading}
          error={error}
          rows={pagedAppointments.map((item) => ({
            ...item,
            datetime: formatDateTime(item.datetime),
          }))}
          page={page}
          totalPages={totalPages}
          totalItems={visibleAppointments.length}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </div>
    </div>
  )
}
