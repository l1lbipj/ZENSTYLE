import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import businessApi from '../../Api/businessApi'
import { formatFullDateTime } from '../../utils/dateTime'
import AppointmentTable from '../../components/staff/AppointmentTable'
import styles from './StaffPages.module.css'

const PAGE_SIZE = 8

function mapStatus(appointment, detailStatus) {
  const appointmentStatus = appointment?.status
  const paymentStatus = appointment?.payment_status
  const startedAt = appointment?.startedAt || appointment?.started_at
  const completedAt = appointment?.completedAt || appointment?.completed_at

  if (appointmentStatus === 'inactive' || appointmentStatus === 'cancelled') {
    return paymentStatus === 'pay' ? 'completed' : 'cancelled'
  }

  if (completedAt || detailStatus === 'inactive') {
    return 'completed'
  }

  if (startedAt) {
    return 'in_progress'
  }

  return 'pending'
}

function getServiceStage(detail) {
  if (detail?.completedAt || detail?.detailStatus === 'inactive') return 'completed'
  if (detail?.startedAt) return 'in_progress'
  return 'not_started'
}

function isServiceDetail(detail) {
  return Boolean(detail?.service_id || detail?.service)
}

function getServiceName(detail) {
  return detail?.service?.service_name || 'Service'
}

export default function StaffTasksPage() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [editValues, setEditValues] = useState({})
  const [page, setPage] = useState(1)
  const [busyAction, setBusyAction] = useState(null)
  const focusedAppointmentId = searchParams.get('appointment_id')

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
              allergies: (appointment?.client?.allergies || []).map((item) => item?.allergy_name).filter(Boolean),
              serviceName: getServiceName(detail),
              datetimeRaw: appointment?.appointment_date,
              detailStatus: detail?.status,
              startedAt: detail?.started_at,
              completedAt: detail?.completed_at,
              status: mapStatus({
                ...appointment,
                started_at: detail?.started_at,
                completed_at: detail?.completed_at,
              }, detail?.status),
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
    setBusyAction(`complete-${detailId}`)
    try {
      await businessApi.completeTask(detailId)
      handleMessage('success', 'Task marked as completed.')
      await loadAppointments()
    } catch (err) {
      handleMessage('error', err?.response?.data?.message || 'Unable to complete task.')
    } finally {
      setBusyAction(null)
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
      setEditValues((prev) => {
        const next = { ...prev }
        delete next[appointmentId]
        return next
      })
      await loadAppointments()
    } catch (err) {
      handleMessage('error', err?.response?.data?.message || 'Unable to update appointment.')
    } finally {
      setLoading(false)
    }
  }

  const visibleAppointments = useMemo(() => {
    const filteredByStatus = filter === 'all' ? appointments : appointments.filter((item) => item.status === filter)
    if (!focusedAppointmentId) return filteredByStatus
    return filteredByStatus.filter((item) => String(item.appointmentId) === String(focusedAppointmentId))
  }, [appointments, filter, focusedAppointmentId])

  const pagedAppointments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visibleAppointments.slice(start, start + PAGE_SIZE)
  }, [visibleAppointments, page])

  const totalPages = Math.max(1, Math.ceil(visibleAppointments.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [filter, focusedAppointmentId])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Appointment history</h2>
          <p className={styles.subtitle}>Review services you handled with customer details.</p>
        </header>

        {focusedAppointmentId ? (
          <p className={styles.state}>
            Showing details for appointment #{focusedAppointmentId}
          </p>
        ) : null}

        {message ? (
          <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div>
        ) : null}

        <AppointmentTable
          title="Service records"
          description="Sorted by latest appointment time."
          filters={[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ]}
          activeFilter={filter}
          onFilterChange={setFilter}
          loading={loading}
          error={error}
          rows={pagedAppointments.map((item) => ({
            ...item,
            datetime: formatFullDateTime(item.datetimeRaw),
            serviceStage: getServiceStage(item),
          }))}
          page={page}
          totalPages={totalPages}
          totalItems={visibleAppointments.length}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          actionRenderer={(item) => {
            const isPending = item.status === 'pending'
            const serviceStage = item.serviceStage || getServiceStage(item)
            const isStarted = serviceStage === 'in_progress' || serviceStage === 'completed'
            const isCompleted = serviceStage === 'completed'
            const appointmentId = item.appointmentId
            const value = editValues[appointmentId] ?? formatLocalDateTime(item.datetimeRaw)
            const isStartBusy = busyAction === `start-${appointmentId}`
            const isCompleteBusy = busyAction === `complete-${item.id}`

            return (
              <div className={styles.rowActions}>
                {!isStarted ? (
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                      disabled={isStartBusy || loading}
                      onClick={async () => {
                        setBusyAction(`start-${appointmentId}`)
                        try {
                          await businessApi.startAppointmentService(appointmentId)
                          handleMessage('success', 'Service started.')
                          await loadAppointments()
                        } catch (err) {
                          handleMessage('error', err?.response?.data?.message || 'Unable to start service.')
                        } finally {
                          setBusyAction(null)
                        }
                      }}
                    >
                      {isStartBusy ? 'Starting...' : 'Start service'}
                    </button>
                  </div>
                ) : null}
                {isStarted && !isCompleted ? (
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                      disabled={isCompleteBusy || loading}
                      onClick={() => handleComplete(item.id)}
                    >
                      {isCompleteBusy ? 'Completing...' : 'Mark complete'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                      disabled={busyAction === `end-${appointmentId}` || loading}
                      onClick={async () => {
                        setBusyAction(`end-${appointmentId}`)
                        try {
                          await businessApi.endAppointmentService(appointmentId)
                          handleMessage('success', 'Service ended.')
                          await loadAppointments()
                        } catch (err) {
                          handleMessage('error', err?.response?.data?.message || 'Unable to end service.')
                        } finally {
                          setBusyAction(null)
                        }
                      }}
                    >
                      {busyAction === `end-${appointmentId}` ? 'Ending...' : 'End service'}
                    </button>
                  </div>
                ) : null}
                {isPending && !isStarted ? (
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
                  <span className={styles.actionHint}>
                    {isCompleted ? 'Service completed' : isStarted ? 'Service in progress' : 'No actions available'}
                  </span>
                )}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
