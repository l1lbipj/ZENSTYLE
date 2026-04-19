import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { getLocalDateString } from '../../utils/date'

export default function AppointmentForm({ onSubmit, loading = false, serviceOptions = [], staffOptions = [] }) {
  const [formData, setFormData] = useState({
    service: '',
    staff: '',
    date: '',
    time: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' })) // Clear error on change
  }

  const validate = () => {
    const newErrors = {}
    const today = getLocalDateString()
    if (!formData.service) newErrors.service = 'Service is required'
    if (!formData.staff) newErrors.staff = 'Staff is required'
    if (formData.staff && Number.isNaN(Number(formData.staff))) newErrors.staff = 'Staff is invalid'
    if (formData.service && Number.isNaN(Number(formData.service))) newErrors.service = 'Service is invalid'
    if (!formData.date) newErrors.date = 'Date is required'
    else if (formData.date < today) newErrors.date = 'Date cannot be in the past'
    if (!formData.time) newErrors.time = 'Time is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(formData)
  }

  return (
    <form className="zs-form" onSubmit={handleSubmit}>
      <Select
        label="Service"
        name="service"
        options={serviceOptions}
        value={formData.service}
        onChange={handleChange}
        required
      />
      {errors.service && (
        <span id="service-error" className="error" role="alert">
          {errors.service}
        </span>
      )}
      <Select
        label="Preferred Staff"
        name="staff"
        options={staffOptions}
        value={formData.staff}
        onChange={handleChange}
        required
      />
      {errors.staff && (
        <span id="staff-error" className="error" role="alert">
          {errors.staff}
        </span>
      )}
      <Input
        label="Date"
        name="date"
        type="date"
        value={formData.date}
        onChange={handleChange}
        required
        aria-describedby={errors.date ? 'date-error' : undefined}
      />
      {errors.date && <span id="date-error" className="error" role="alert">{errors.date}</span>}
      <Input
        label="Time"
        name="time"
        type="time"
        value={formData.time}
        onChange={handleChange}
        required
        aria-describedby={errors.time ? 'time-error' : undefined}
      />
      {errors.time && <span id="time-error" className="error" role="alert">{errors.time}</span>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  )
}
