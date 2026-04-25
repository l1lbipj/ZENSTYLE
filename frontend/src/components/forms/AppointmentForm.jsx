import { useMemo, useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { getLocalDateString } from '../../utils/date'

const MAX_SERVICES = 3
const BUSINESS_START_MINUTES = 7 * 60
const BUSINESS_END_MINUTES = 22 * 60
const SLOT_STEP_MINUTES = 30

function newServiceRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    service: '',
    staff: '',
    time: '',
  }
}

function minutesToTimeString(totalMinutes) {
  const minutes = Math.max(0, Math.min(24 * 60 - 1, totalMinutes))
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function timeStringToMinutes(value) {
  if (!value || typeof value !== 'string') return Number.NaN
  const [hours, minutes] = value.split(':').map((item) => Number(item))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN
  return (hours * 60) + minutes
}

export default function AppointmentForm({ onSubmit, loading = false, serviceOptions = [], staffOptions = [], serviceDurationById = {} }) {
  const [formData, setFormData] = useState({
    date: '',
    services: [newServiceRow()],
  })
  const [errors, setErrors] = useState({})

  const canAddMoreServices = formData.services.length < MAX_SERVICES

  const serviceWarning = useMemo(() => {
    if (formData.services.length < MAX_SERVICES) return ''
    return 'Maximum 3 services per appointment.'
  }, [formData.services.length])

  const serviceLabelById = useMemo(
    () =>
      serviceOptions.reduce((acc, option) => {
        acc[String(option.value)] = option.label
        return acc
      }, {}),
    [serviceOptions],
  )

  const staffLabelById = useMemo(
    () =>
      staffOptions.reduce((acc, option) => {
        acc[String(option.value)] = option.label
        return acc
      }, {}),
    [staffOptions],
  )

  const timeOptionsByRow = useMemo(() => {
    return formData.services.reduce((acc, row) => {
      const duration = Number(serviceDurationById[row.service] || 60)
      const latestStart = Math.max(BUSINESS_START_MINUTES, BUSINESS_END_MINUTES - duration)
      const options = []

      for (let minutes = BUSINESS_START_MINUTES; minutes <= latestStart; minutes += SLOT_STEP_MINUTES) {
        const label = minutesToTimeString(minutes)
        options.push({
          value: label,
          label: new Date(`2000-01-01T${label}:00`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
        })
      }

      acc[row.id] = options
      return acc
    }, {})
  }, [formData.services, serviceDurationById])

  const handleDateChange = (event) => {
    const value = event.target.value
    setFormData((prev) => ({ ...prev, date: value }))
    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }))
  }

  const updateRow = (rowId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    }))

    const errorKey = `${rowId}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }))
    }
  }

  const addServiceRow = () => {
    if (!canAddMoreServices) return
    setFormData((prev) => ({ ...prev, services: [...prev.services, newServiceRow()] }))
  }

  const removeServiceRow = (rowId) => {
    if (formData.services.length === 1) return
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((row) => row.id !== rowId),
    }))
  }

  const validate = () => {
    const newErrors = {}
    const today = getLocalDateString()

    if (!formData.date) {
      newErrors.date = 'Date is required'
    } else if (formData.date < today) {
      newErrors.date = 'Date cannot be in the past'
    }

    if (!Array.isArray(formData.services) || formData.services.length === 0) {
      newErrors.services = 'At least one service is required.'
    }

    if (formData.services.length > MAX_SERVICES) {
      newErrors.services = 'Maximum 3 services per appointment.'
    }

    formData.services.forEach((row) => {
      if (!row.service) newErrors[`${row.id}-service`] = 'Service is required'
      if (!row.staff) newErrors[`${row.id}-staff`] = 'Staff is required'
      if (row.staff && Number.isNaN(Number(row.staff))) newErrors[`${row.id}-staff`] = 'Staff is invalid'
      if (row.service && Number.isNaN(Number(row.service))) newErrors[`${row.id}-service`] = 'Service is invalid'
      if (!row.time) newErrors[`${row.id}-time`] = 'Time is required'

      const startMinutes = timeStringToMinutes(row.time)
      const duration = Number(serviceDurationById[row.service] || 60)
      const endMinutes = startMinutes + duration

      if (Number.isNaN(startMinutes)) {
        newErrors[`${row.id}-time`] = 'Time is invalid'
      } else if (startMinutes < BUSINESS_START_MINUTES || endMinutes > BUSINESS_END_MINUTES) {
        newErrors[`${row.id}-time`] = 'Choose a time between 07:00 AM and 09:00 PM.'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      date: formData.date,
      services: formData.services,
    })
  }

  return (
    <form className="zs-booking-form" onSubmit={handleSubmit}>
      <div className="zs-booking-form__head">
        <div>
          <h4>Appointment information</h4>
          <p>Select date, services, staff, and preferred start time.</p>
        </div>
        <span className="zs-booking-form__counter">
          {formData.services.length}/{MAX_SERVICES} services
        </span>
      </div>

      <div className="zs-booking-form__date">
        <Input
          label="Appointment date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleDateChange}
          required
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date ? (
          <span id="date-error" className="zs-form-error" role="alert">
            {errors.date}
          </span>
        ) : null}
      </div>

      <div className="zs-booking-form__services">
        {formData.services.map((row, index) => (
          <div key={row.id} className="zs-booking-form__service-card">
            <div className="zs-booking-form__service-head">
              <h5>Service #{index + 1}</h5>
              {formData.services.length > 1 ? (
                <button
                  type="button"
                  className="zs-btn zs-btn--ghost zs-btn--sm"
                  onClick={() => removeServiceRow(row.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="zs-booking-form__service-grid">
              <div>
                <Select
                  label="Service"
                  name={`service-${row.id}`}
                  options={[{ value: '', label: 'Select service' }, ...serviceOptions]}
                  value={row.service}
                  onChange={(e) => updateRow(row.id, 'service', e.target.value)}
                  required
                />
                {errors[`${row.id}-service`] ? (
                  <span className="zs-form-error" role="alert">
                    {errors[`${row.id}-service`]}
                  </span>
                ) : null}
              </div>

              <div>
                <Select
                  label="Staff"
                  name={`staff-${row.id}`}
                  options={[{ value: '', label: 'Select staff' }, ...staffOptions]}
                  value={row.staff}
                  onChange={(e) => updateRow(row.id, 'staff', e.target.value)}
                  required
                />
                {errors[`${row.id}-staff`] ? (
                  <span className="zs-form-error" role="alert">
                    {errors[`${row.id}-staff`]}
                  </span>
                ) : null}
              </div>

              <div>
                <Select
                  label="Start time"
                  name={`time-${row.id}`}
                  options={[{ value: '', label: 'Select time' }, ...(timeOptionsByRow[row.id] || [])]}
                  value={row.time}
                  onChange={(e) => updateRow(row.id, 'time', e.target.value)}
                  required
                  aria-describedby={errors[`${row.id}-time`] ? `${row.id}-time-error` : undefined}
                />
                {errors[`${row.id}-time`] ? (
                  <span id={`${row.id}-time-error`} className="zs-form-error" role="alert">
                    {errors[`${row.id}-time`]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors.services ? (
        <span className="zs-form-error" role="alert">
          {errors.services}
        </span>
      ) : null}
      {serviceWarning ? (
        <span className="zs-form-error" role="alert">
          {serviceWarning}
        </span>
      ) : null}

      <div className="zs-booking-form__summary">
        <h5>Quick summary</h5>
        <ul>
          {formData.services.map((row) => (
            <li key={`summary-${row.id}`}>
              <strong>{serviceLabelById[row.service] || 'Select service'}</strong>
              <span>{staffLabelById[row.staff] || 'Select staff'}</span>
              <span>{row.time || 'Select time'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="zs-action-row">
        <Button type="button" variant="ghost" onClick={addServiceRow} disabled={!canAddMoreServices || loading}>
          Add service
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Booking appointment...' : 'Confirm booking'}
        </Button>
      </div>
    </form>
  )
}
