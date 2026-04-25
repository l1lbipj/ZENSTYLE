import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDate, formatDateTime, formatTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

function getAppointmentDetails(item) {
  return item?.appointment_details || item?.appointmentDetails || []
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

function getServiceNames(details) {
  return uniqueValues(
    details.map((detail) => detail?.service?.service_name || detail?.item_name || detail?.service_name),
  )
}

function getStaffNames(details) {
  return uniqueValues(details.map((detail) => detail?.staff?.staff_name || detail?.staff_name))
}

function getTone(row) {
  const attendance = String(row.attendance_status || '').toLowerCase()
  const payment = String(row.payment_status || '').toLowerCase()
  const status = String(row.status || '').toLowerCase()

  if (attendance === 'cancelled' || status === 'inactive') return 'neutral'
  if (attendance === 'completed' || payment === 'pay') return 'success'
  if (attendance === 'checked-in') return 'accent'
  if (attendance === 'missed') return 'warning'
  return 'warning'
}

function getApprovalLabel(row) {
  if (String(row.attendance_status || '').toLowerCase() === 'cancelled' || row.status === 'inactive') {
    return 'Cancelled'
  }
  return row.payment_status === 'pay' ? 'Approved' : 'Pending approval'
}

function getAttendanceLabel(row) {
  return row.attendance_status || 'Pending'
}

function getApiErrorMessage(err, fallback) {
  const fieldErrors = err?.response?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldErrors = Object.values(fieldErrors).find((messages) => Array.isArray(messages) && messages.length)
    if (firstFieldErrors) return firstFieldErrors[0]
  }

  return err?.response?.data?.message || fallback
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [actionState, setActionState] = useState({ id: null, type: null })

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await businessApi.appointments({
        per_page: 100,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      })
      setAppointments(res?.data?.data?.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load appointments.'))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const refreshFromState = useCallback(async () => {
    const res = await businessApi.appointments({
      per_page: 100,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    })
    const rows = res?.data?.data?.data || []
    setAppointments(rows)

    if (selectedAppointment?.appointment_id) {
      const nextSelected = rows.find((item) => item.appointment_id === selectedAppointment.appointment_id)
      setSelectedAppointment(nextSelected || null)
    }
  }, [dateFrom, dateTo, selectedAppointment])

  const mappedAppointments = useMemo(
    () =>
      appointments.map((item) => {
        const details = getAppointmentDetails(item)
        const serviceNames = getServiceNames(details)
        const staffNames = getStaffNames(details)
        const clientName = item?.client?.client_name || item?.client_name || 'Client'
        const appointmentDate = item?.appointment_date || null
        return {
          ...item,
          details,
          serviceNames,
          staffNames,
          clientName,
          serviceSummary: serviceNames.length > 0 ? serviceNames.join(', ') : 'Service',
          staffSummary: staffNames.length > 0 ? staffNames.join(', ') : 'TBD',
          approvalLabel: getApprovalLabel(item),
          attendanceLabel: getAttendanceLabel(item),
          tone: getTone(item),
          appointmentTimeLabel: appointmentDate ? formatDateTime(appointmentDate) : '--',
          appointmentDateOnly: appointmentDate ? formatDate(appointmentDate) : '--',
          appointmentClock: appointmentDate ? formatTime(appointmentDate) : '--',
        }
      }),
    [appointments],
  )

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return mappedAppointments.filter((item) => {
      const matchesQuery =
        !query ||
        [item.clientName, item.serviceSummary, item.staffSummary, item.approvalLabel, item.attendanceLabel, item.appointment_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      const matchesStatus = !statusFilter || String(item.attendanceLabel || '').toLowerCase() === statusFilter
      const matchesPayment = !paymentFilter || String(item.payment_status || '').toLowerCase() === paymentFilter

      return matchesQuery && matchesStatus && matchesPayment
    })
  }, [mappedAppointments, paymentFilter, search, statusFilter])

  const counts = useMemo(() => {
    const total = filteredAppointments.length
    const approved = filteredAppointments.filter((item) => item.payment_status === 'pay').length
    const pending = filteredAppointments.filter((item) => String(item.payment_status || '').toLowerCase() === 'unpay').length
    const cancelled = filteredAppointments.filter((item) => String(item.attendance_status || '').toLowerCase() === 'cancelled' || item.status === 'inactive').length

    return { total, approved, pending, cancelled }
  }, [filteredAppointments])

  const openAppointment = (item) => {
    setSelectedAppointment(item)
  }

  const performAction = async (id, type, action, successMessage) => {
    setActionState({ id, type })
    setError('')
    try {
      await action(id)
      await refreshFromState()
      if (successMessage) {
        setError('')
      }
    } catch (err) {
      setError(getApiErrorMessage(err, `${type} failed.`))
    } finally {
      setActionState({ id: null, type: null })
    }
  }

  const handleApprove = async (id) => {
    await performAction(id, 'approve', (appointmentId) => businessApi.approveAppointment(appointmentId), 'Appointment approved successfully.')
  }

  const handleCancel = async (id) => {
    await performAction(id, 'cancel', (appointmentId) => businessApi.cancelAppointmentAdmin(appointmentId), 'Appointment cancelled successfully.')
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Appointments"
        subtitle="Review booking requests, monitor attendance, and approve or cancel appointments from one place."
      />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Total appointments" description="Visible in the current filter range.">
          <h3 style={{ margin: 0 }}>{counts.total}</h3>
        </Card>
        <Card title="Approved" description="Appointments already confirmed.">
          <h3 style={{ margin: 0 }}>{counts.approved}</h3>
        </Card>
        <Card title="Pending" description="Waiting for approval.">
          <h3 style={{ margin: 0 }}>{counts.pending}</h3>
        </Card>
        <Card title="Cancelled" description="Closed appointments.">
          <h3 style={{ margin: 0 }}>{counts.cancelled}</h3>
        </Card>
      </div>

      <Section
        title="Appointment list"
        description="Filter by date, status, or payment approval, then open a record for full details."
      >
        <div className="zs-toolbar">
          <input
            className="zs-input zs-toolbar__input"
            placeholder="Search client, service, or staff"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="zs-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All attendance</option>
            <option value="pending">Pending</option>
            <option value="checked-in">Checked-In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="missed">Missed</option>
          </select>
          <select className="zs-input" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All approvals</option>
            <option value="pay">Approved</option>
            <option value="unpay">Pending approval</option>
          </select>
          <input className="zs-input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <input className="zs-input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={loadAppointments}>
            Refresh
          </button>
        </div>

        {loading ? <p className="zs-card__description">Loading appointments...</p> : null}

        {!loading && filteredAppointments.length === 0 ? (
          <Card title="No appointments found" description="Try changing the filters or date range.">
            <p className="zs-card__description">There are no appointment records for the current criteria.</p>
          </Card>
        ) : null}

        {!loading && filteredAppointments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="zs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Staff</th>
                  <th>Schedule</th>
                  <th>Approval</th>
                  <th>Attendance</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item) => {
                  const isApproved = item.payment_status === 'pay'
                  const isCancelled = String(item.attendance_status || '').toLowerCase() === 'cancelled' || item.status === 'inactive'
                  const canApprove = item.status === 'active' && !isApproved && !isCancelled
                  const canCancel = item.status === 'active' && !isCancelled && !['checked-in', 'completed'].includes(String(item.attendance_status || '').toLowerCase())

                  return (
                    <tr key={item.appointment_id}>
                      <td>{item.appointment_id}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <strong>{item.clientName}</strong>
                          <span className="zs-card__description">{item?.client?.phone || item?.client?.email || '--'}</span>
                        </div>
                      </td>
                      <td>{item.serviceSummary}</td>
                      <td>{item.staffSummary}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <strong>{item.appointmentDateOnly}</strong>
                          <span className="zs-card__description">{item.appointmentClock}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={isCancelled ? 'neutral' : isApproved ? 'success' : 'warning'}>{item.approvalLabel}</Badge>
                      </td>
                      <td>
                        <Badge tone={item.tone}>{item.attendanceLabel}</Badge>
                      </td>
                      <td>{formatUSD(Number(item.final_amount ?? item.total_amount ?? 0), { from: 'USD' })}</td>
                      <td>
                        <div className="zs-table__actions">
                          <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openAppointment(item)}>
                            View
                          </button>
                          {canApprove ? (
                            <button
                              type="button"
                              className="zs-btn zs-btn--primary zs-btn--sm"
                              onClick={() => handleApprove(item.appointment_id)}
                              disabled={actionState.id === item.appointment_id}
                            >
                              {actionState.id === item.appointment_id && actionState.type === 'approve' ? 'Approving...' : 'Approve'}
                            </button>
                          ) : null}
                          {canCancel ? (
                            <button
                              type="button"
                              className="zs-btn zs-btn--ghost zs-btn--sm"
                              onClick={() => handleCancel(item.appointment_id)}
                              disabled={actionState.id === item.appointment_id}
                            >
                              {actionState.id === item.appointment_id && actionState.type === 'cancel' ? 'Cancelling...' : 'Cancel'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>

      <Modal
        open={!!selectedAppointment}
        title={selectedAppointment ? `Appointment #${selectedAppointment.appointment_id}` : 'Appointment details'}
        onClose={() => setSelectedAppointment(null)}
      >
        {selectedAppointment ? (
          <div className="zs-form">
            <div className="zs-dashboard__row" style={{ marginBottom: 0 }}>
              <Card title="Client" description="Appointment owner">
                <p className="zs-card__description">
                  <strong>{selectedAppointment.clientName}</strong>
                </p>
                <p className="zs-card__description">{selectedAppointment?.client?.phone || '--'}</p>
                <p className="zs-card__description">{selectedAppointment?.client?.email || '--'}</p>
              </Card>
              <Card title="Timing" description="Booking schedule">
                <p className="zs-card__description">Date: {selectedAppointment.appointmentDateOnly}</p>
                <p className="zs-card__description">Time: {selectedAppointment.appointmentClock}</p>
                <p className="zs-card__description">Full: {selectedAppointment.appointmentTimeLabel}</p>
              </Card>
              <Card title="Status" description="Operational state">
                <p className="zs-card__description">
                  Approval: <Badge tone={selectedAppointment.payment_status === 'pay' ? 'success' : 'warning'}>{selectedAppointment.approvalLabel}</Badge>
                </p>
                <p className="zs-card__description">
                  Attendance: <Badge tone={selectedAppointment.tone}>{selectedAppointment.attendanceLabel}</Badge>
                </p>
                <p className="zs-card__description">Payment method: {selectedAppointment.payment_method || '--'}</p>
              </Card>
            </div>

            <Card title="Service details" description="All assigned items for this appointment.">
              <table className="zs-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAppointment.details?.length > 0 ? (
                    selectedAppointment.details.map((detail) => (
                      <tr key={detail.detail_id || `${detail.service_id}-${detail.staff_id}-${detail.start_time}`}>
                        <td>{detail?.service?.service_name || detail.item_name || detail.service_name || 'Service'}</td>
                        <td>{detail?.staff?.staff_name || '--'}</td>
                        <td>{formatTime(detail.start_time)}</td>
                        <td>{formatTime(detail.end_time)}</td>
                        <td>{formatUSD(Number(detail.price || detail?.service?.price || 0), { from: 'USD' })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No appointment details available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            <Card title="Summary" description="Financial and record information.">
              <p className="zs-card__description">Appointment date: {formatDate(selectedAppointment.appointment_date)}</p>
              <p className="zs-card__description">Total amount: {formatUSD(Number(selectedAppointment.total_amount || 0), { from: 'USD' })}</p>
              <p className="zs-card__description">Final amount: {formatUSD(Number(selectedAppointment.final_amount || 0), { from: 'USD' })}</p>
              <p className="zs-card__description">Notes: {selectedAppointment.notes || '--'}</p>
            </Card>

            <div className="zs-action-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="zs-action-row" style={{ flexWrap: 'wrap' }}>
                {selectedAppointment.status === 'active' && selectedAppointment.payment_status !== 'pay' && String(selectedAppointment.attendance_status || '').toLowerCase() !== 'cancelled' ? (
                  <button
                    type="button"
                    className="zs-btn zs-btn--primary"
                    onClick={() => handleApprove(selectedAppointment.appointment_id)}
                    disabled={actionState.id === selectedAppointment.appointment_id}
                  >
                    {actionState.id === selectedAppointment.appointment_id && actionState.type === 'approve' ? 'Approving...' : 'Approve appointment'}
                  </button>
                ) : null}
                {selectedAppointment.status === 'active' &&
                !['checked-in', 'completed', 'cancelled'].includes(String(selectedAppointment.attendance_status || '').toLowerCase()) ? (
                  <button
                    type="button"
                    className="zs-btn zs-btn--ghost"
                    onClick={() => handleCancel(selectedAppointment.appointment_id)}
                    disabled={actionState.id === selectedAppointment.appointment_id}
                  >
                    {actionState.id === selectedAppointment.appointment_id && actionState.type === 'cancel' ? 'Cancelling...' : 'Cancel appointment'}
                  </button>
                ) : null}
              </div>
              <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
