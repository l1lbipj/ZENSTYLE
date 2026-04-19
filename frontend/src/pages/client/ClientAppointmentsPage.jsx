import { useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

const columns = [
  { key: 'service', header: 'Service' },
  { key: 'staff', header: 'Staff' },
  { key: 'time', header: 'Time' },
  { key: 'status', header: 'Status' },
]

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const [rescheduleValues, setRescheduleValues] = useState({})
  const [message, setMessage] = useState('')

  const loadAppointments = () => {
    businessApi
      .appointments({ per_page: 50 })
      .then((res) => {
        setAppointments(res?.data?.data?.data || [])
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load appointments.')
      })
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const data = useMemo(
    () =>
      appointments.map((item) => {
        const firstDetail = item.appointment_details?.[0]
        const serviceName = firstDetail?.item?.service_name || firstDetail?.item?.product_name || 'Service'
        const staffName = firstDetail?.staff?.staff_name || 'TBD'
        const isUpcoming = new Date(item.appointment_date) > new Date()
        const tone = item.status === 'inactive' ? 'neutral' : isUpcoming ? 'accent' : 'success'
        const label = item.status === 'inactive' ? 'Completed / Closed' : isUpcoming ? 'Upcoming' : 'In progress'

        return {
          id: item.appointment_id,
          service: serviceName,
          staff: staffName,
          time: formatDateTime(item.appointment_date),
          status: <Badge tone={tone}>{label}</Badge>,
        }
      }),
    [appointments],
  )

  if (error) {
    return <p>{error}</p>
  }

  const handleReschedule = async (id) => {
    const value = rescheduleValues[id]
    if (!value) {
      setMessage('Please choose a new date/time first.')
      return
    }
    try {
      await businessApi.rescheduleAppointment(id, { appointment_date: value })
      setMessage('Appointment rescheduled.')
      loadAppointments()
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Reschedule failed.')
    }
  }

  return (
    <>
      {message ? <p>{message}</p> : null}
      <DataTable
        caption="Your upcoming and recent appointments"
        columns={columns}
        data={data}
        actionsLabel="Manage"
        renderActions={(row) => (
          <div className="zs-table__actions">
            <input
              className="zs-input"
              type="datetime-local"
              value={rescheduleValues[row.id] || ''}
              onChange={(event) => setRescheduleValues((prev) => ({ ...prev, [row.id]: event.target.value }))}
            />
            <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => handleReschedule(row.id)}>
              Reschedule
            </button>
          </div>
        )}
      />
    </>
  )
}
