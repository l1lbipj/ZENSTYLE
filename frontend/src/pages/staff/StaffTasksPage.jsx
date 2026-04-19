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
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [editValues, setEditValues] = useState({})
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
            appointmentId: appointment?.appointment_id,
            customerName: appointment?.client?.client_name || 'Customer',
            phone: appointment?.client?.phone || '-',
            serviceName: getServiceName(detail),
            datetimeRaw: appointment?.appointment_date,
            status: mapStatus(appointment),
          })
        })
      })

      details.sort((a, b) => new Date(b.datetimeRaw || 0) - new Date(a.datetimeRaw || 0))
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

  const handleMessage = (tone, text) => {
    setMessageTone(tone)
    setMessage(text)
  }

  const formatLocalDateTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date - offset).toISOString().slice(0, 16)
  }

  const handleComplete = async (detailId) => {
    setLoading(true)
    try {
      await businessApi.completeTask(detailId)
      handleMessage('success', 'Task marked as completed.')
      await loadAppointments()
    } catch (err) {
      handleMessage('error', err?.response?.data?.message || 'Unable to complete task.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (appointmentId) => {
    setLoading(true)
    try {
      await businessApi.cancelAppointment(appointmentId)
      handleMessage('success', 'Appointment rejected successfully.')
      await loadAppointments()
    } catch (err) {
      handleMessage('error', err?.response?.data?.message || 'Unable to reject appointment.')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async (appointmentId) => {
    const value = editValues[appointmentId]
    if (!value) {
      handleMessage('error', 'Please choose a new date and time.')
      return
    }

    setLoading(true)
    try {
      await businessApi.rescheduleAppointment(appointmentId, { appointment_date: value })
      handleMessage('success', 'Appointment updated successfully.')
      await loadAppointments()
    } catch (err) {
      handleMessage('error', err?.response?.data?.message || 'Unable to update appointment.')
    } finally {
      setLoading(false)
    }
  }

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

        {message ? (
          <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div>
        ) : null}

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
            datetime: formatDateTime(item.datetimeRaw),
          }))}
          page={page}
          totalPages={totalPages}
          totalItems={visibleAppointments.length}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          actionRenderer={(item) => {
            const canEdit = item.status !== 'cancelled'
            const showComplete = item.status === 'pending'
            const appointmentId = item.appointmentId
            const value = editValues[appointmentId] ?? formatLocalDateTime(item.datetimeRaw)

            return (
              <div className={styles.rowActions}>
                {showComplete ? (
                  <div className={styles.actionGroup}>
                    <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={() => handleComplete(item.id)}>
                      Mark complete
                    </button>
                  </div>
                ) : null}
                {canEdit ? (
                  <div className={styles.actionCell}>
                    <label className={styles.actionLabel} htmlFor={`edit-${appointmentId}`}>
                      Change date/time
                    </label>
                    <input
                      id={`edit-${appointmentId}`}
                      type="datetime-local"
                      className={styles.actionInput}
                      value={value}
                      onChange={(event) =>
                        setEditValues((prev) => ({ ...prev, [appointmentId]: event.target.value }))
                      }
                    />
                    <div className={styles.actionGroup}>
                      <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={() => handleReschedule(appointmentId)}>
                        Update
                      </button>
                      <button type="button" className={`${styles.actionButton} ${styles.actionButtonDanger}`} onClick={() => handleReject(appointmentId)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className={styles.actionHint}>No actions available</span>
                )}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
