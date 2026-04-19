import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

export default function FeedbackPage() {
  const [rating, setRating] = useState('5')
  const [notes, setNotes] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentId, setAppointmentId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    businessApi
      .appointments({ per_page: 20 })
      .then((res) => {
        if (!mounted) return
        const rows = res?.data?.data?.data || []
        setAppointments(rows)
        if (rows[0]) setAppointmentId(String(rows[0].appointment_id))
      })
      .catch(() => {
        if (!mounted) return
        setAppointments([])
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    businessApi
      .submitFeedback({
        appointment_id: Number(appointmentId),
        rating: Number(rating),
        notes,
      })
      .then(() => setMessage('Feedback submitted successfully.'))
      .catch((err) => setMessage(err?.response?.data?.message || 'Failed to submit feedback.'))
  }

  return (
    <Card title="Share feedback" description="Tell us about your visit.">
      {message ? <p>{message}</p> : null}
      <form className="zs-form" onSubmit={handleSubmit}>
        <label className="zs-field">
          <span className="zs-field__label">Appointment</span>
          <select className="zs-select" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required>
            {appointments.map((appt) => (
              <option key={appt.appointment_id} value={appt.appointment_id}>
                {formatDateTime(appt.appointment_date)}
              </option>
            ))}
          </select>
        </label>
        <label className="zs-field">
          <span className="zs-field__label">Rating</span>
          <select className="zs-select" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Great</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </label>
        <label className="zs-field">
          <span className="zs-field__label">Comments</span>
          <textarea className="zs-textarea" rows="4" placeholder="Share details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <Button type="submit">Submit feedback</Button>
      </form>
    </Card>
  )
}
