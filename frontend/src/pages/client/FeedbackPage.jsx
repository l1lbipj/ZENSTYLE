import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'

export default function FeedbackPage() {
  const [rating, setRating] = useState('5')
  const [notes, setNotes] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentId, setAppointmentId] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    businessApi
      .appointments({ per_page: 50, status: 'inactive' })
      .then((res) => {
        if (!mounted) return
        const rows = (res?.data?.data?.data || []).filter((appt) => appt.status === 'inactive')
        setAppointments(rows)
        if (rows[0]) setAppointmentId(String(rows[0].appointment_id))
      })
      .catch(() => {
        if (!mounted) return
        setAppointments([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const appointmentOptions = useMemo(
    () =>
      appointments.map((appt) => ({
        value: String(appt.appointment_id),
        label: formatDateTime(appt.appointment_date),
      })),
    [appointments],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    businessApi
      .submitFeedback({
        appointment_id: Number(appointmentId),
        rating: Number(rating),
        notes,
      })
      .then(() => {
        setMessageTone('success')
        setMessage('Feedback submitted successfully.')
      })
      .catch((err) => {
        setMessageTone('error')
        setMessage(err?.response?.data?.message || 'Failed to submit feedback.')
      })
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Share feedback"
        subtitle="Tell us how your visit went so we can keep improving your next experience."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/history">
            View service history
          </Link>
        }
      />

      {message ? <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Why feedback matters" description="Your comments help us improve both service quality and staff support.">
          <p className="zs-card__description">Short, honest feedback is enough. You do not need to write a long review unless you want to.</p>
        </Card>
        <Card title="Need to book again?" description="If you are ready for your next visit, you can do it right away.">
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book appointment
          </Link>
        </Card>
      </div>

      <Section title="Feedback form" description="Choose an appointment and share your experience.">
        {loading ? (
          <Card title="Loading appointments" description="We are checking which completed visits can be reviewed." />
        ) : appointmentOptions.length === 0 ? (
          <Card title="No completed appointments yet" description="You can leave feedback after an appointment has been completed." />
        ) : (
          <form className="zs-form" onSubmit={handleSubmit}>
            <label className="zs-field">
              <span className="zs-field__label">Appointment</span>
              <select className="zs-select" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required>
                {appointmentOptions.map((appt) => (
                  <option key={appt.value} value={appt.value}>
                    {appt.label}
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
              <textarea
                className="zs-textarea"
                rows="4"
                placeholder="Share what you liked, or what could be better..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <Button type="submit">Submit feedback</Button>
          </form>
        )}
      </Section>
    </div>
  )
}
