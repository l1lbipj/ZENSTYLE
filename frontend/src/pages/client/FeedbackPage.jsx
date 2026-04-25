import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatFullDateTime } from '../../utils/dateTime'
import '../../components/feedback/FeedbackManagementView.css'

function renderStars(rating) {
  const total = 5
  const value = Math.max(0, Math.min(total, Number(rating || 0)))
  return '★'.repeat(value) + '☆'.repeat(total - value)
}

export default function FeedbackPage() {
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentId, setAppointmentId] = useState('')
  const [feedbackHistory, setFeedbackHistory] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback((filters = {}) => {
    setLoading(true)
    const params = filters.fromDate && filters.toDate ? { from_date: filters.fromDate, to_date: filters.toDate } : undefined
    Promise.allSettled([
      businessApi.appointments({ per_page: 50, status: 'inactive' }),
      businessApi.feedbackList({ per_page: 50, ...params }),
    ])
      .then(([appointmentsRes, feedbackRes]) => {
        const appointmentRows =
          appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value?.data?.data?.data || []).filter((appt) => appt.status === 'inactive') : []
        setAppointments(appointmentRows)
        if (appointmentRows[0]) {
          setAppointmentId((current) => current || String(appointmentRows[0].appointment_id))
        }

        const historyRows =
          feedbackRes.status === 'fulfilled' ? feedbackRes.value?.data?.data?.data || feedbackRes.value?.data?.data || [] : []
        setFeedbackHistory(Array.isArray(historyRows) ? historyRows : [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadData])

  const handleApplyRange = () => {
    loadData({ fromDate, toDate })
  }

  const handleClearRange = () => {
    setFromDate('')
    setToDate('')
    loadData()
  }

  const appointmentOptions = useMemo(
    () =>
      appointments.map((appt) => ({
        value: String(appt.appointment_id),
        label: formatFullDateTime(appt.appointment_date),
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
        comment,
      })
      .then(() => {
        setMessageTone('success')
        setMessage('Feedback submitted successfully.')
        setComment('')
        loadData()
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
        subtitle="Tell us how your visit went and check responses from our team."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/history">
            View service history
          </Link>
        }
      />

      {message ? <div className={`zs-feedback ${messageTone === 'error' ? 'zs-feedback--error' : 'zs-feedback--success'}`}>{message}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Why feedback matters" description="Your comments help us improve both service quality and staff support.">
          <p className="zs-card__description">Short and honest feedback is enough. We review every message.</p>
        </Card>
        <Card title="Need to book again?" description="If you are ready for your next visit, you can do it right away.">
          <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/book">
            Book appointment
          </Link>
        </Card>
      </div>

      <Section title="Feedback form" description="Choose a completed appointment and share your experience.">
        {loading ? (
          <Card title="Loading appointments" description="Checking completed appointments..." />
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
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <Button type="submit">Submit feedback</Button>
          </form>
        )}
      </Section>

      <Section title="Team replies" description="Your submitted feedback and answers from staff/admin.">
        <div className="zs-toolbar" style={{ marginBottom: '1rem' }}>
          <input className="zs-input zs-toolbar__input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input className="zs-input zs-toolbar__input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Button type="button" variant="secondary" size="sm" onClick={handleApplyRange} disabled={loading || (!fromDate && !toDate)}>
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClearRange} disabled={loading && !fromDate && !toDate}>
            Clear
          </Button>
        </div>
        <div className="zs-feedback-list">
          {feedbackHistory.length === 0 ? (
            <Card title="No feedback submitted yet" description="Once you send feedback, replies will appear here." />
          ) : (
            feedbackHistory.map((row) => (
              <article key={row.id} className="zs-feedback-item">
                <header className="zs-feedback-item__header">
                  <div>
                    <h3>{formatFullDateTime(row.appointment?.datetime)}</h3>
                    <p>Staff: {row.staff?.name || 'Unassigned'}</p>
                  </div>
                  <p className="zs-feedback-stars">{renderStars(row.rating)}</p>
                </header>
                <p className="zs-feedback-item__comment">{row.comment || 'No comment provided.'}</p>
                <div className="zs-feedback-reply-box">
                  {row.reply ? row.reply : 'Pending response from our team.'}
                </div>
              </article>
            ))
          )}
        </div>
      </Section>
    </div>
  )
}
