import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import PageHeader from '../ui/PageHeader'
import businessApi from '../../Api/businessApi'
import { formatFullDateTime } from '../../utils/dateTime'
import './FeedbackManagementView.css'

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload
  return []
}

function shortPreview(text, max = 115) {
  const value = (text || '').trim()
  if (!value) return 'No comment provided.'
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

function renderStars(rating) {
  const total = 5
  const value = Math.max(0, Math.min(total, Number(rating || 0)))
  return '★'.repeat(value) + '☆'.repeat(total - value)
}

function statusTone(hasReply) {
  return hasReply ? 'success' : 'warning'
}

export default function FeedbackManagementView({ mode = 'admin' }) {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const title = mode === 'admin' ? 'Feedback management' : 'My feedback performance'
  const subtitle =
    mode === 'admin'
      ? 'Track all customer feedback, inspect details, and send replies.'
      : 'Review feedback linked to your appointments and answer clients.'

  const fetchFeedbacks = useCallback(async (filters = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = filters.fromDate && filters.toDate ? { from_date: filters.fromDate, to_date: filters.toDate } : undefined
      const res = mode === 'admin' ? await businessApi.adminFeedbacks(params) : await businessApi.staffFeedbacks(params)
      const rows = normalizeRows(res?.data?.data)
      setFeedbacks(rows)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load feedback.')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const handleApply = () => {
    fetchFeedbacks({ fromDate, toDate })
  }

  const handleClear = () => {
    setFromDate('')
    setToDate('')
    fetchFeedbacks()
  }

  const pendingCount = useMemo(() => feedbacks.filter((row) => !row.reply).length, [feedbacks])

  const openDetails = (feedback) => {
    setSelectedFeedback(feedback)
    setReplyDraft(feedback.reply || '')
    setMessage('')
    setError('')
  }

  const closeDetails = () => {
    setSelectedFeedback(null)
    setReplyDraft('')
  }

  const handleReplySubmit = async () => {
    if (!selectedFeedback) return
    const payload = { reply: replyDraft.trim() }
    if (!payload.reply) {
      setError('Reply cannot be empty.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await businessApi.replyFeedback(selectedFeedback.id, payload)
      const updated = res?.data?.data
      setFeedbacks((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      setSelectedFeedback(updated)
      setReplyDraft(updated.reply || '')
      setMessage('Reply saved successfully.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit reply.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          mode !== 'client' ? (
            <div className="zs-action-row">
              <input className="zs-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input className="zs-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <Button type="button" variant="secondary" size="sm" onClick={handleApply} disabled={loading || (!fromDate && !toDate)}>
                Apply
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={loading && !fromDate && !toDate}>
                Clear
              </Button>
            </div>
          ) : null
        }
      />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}
      {message ? <div className="zs-feedback zs-feedback--success">{message}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Feedback volume" description="Current entries ready for review.">
          <p className="zs-feedback-kpi">{feedbacks.length}</p>
          <p className="zs-card__description">Total feedback records loaded.</p>
        </Card>
        <Card title="Pending replies" description="Customer messages waiting for response.">
          <p className="zs-feedback-kpi">{pendingCount}</p>
          <p className="zs-card__description">Respond quickly to improve customer trust.</p>
        </Card>
      </div>

      <section className="zs-feedback-list">
        {loading ? (
          <Card title="Loading feedback" description="Please wait while we gather recent feedback entries." />
        ) : feedbacks.length === 0 ? (
          <Card title="No feedback found" description="There are no feedback records in this view yet." />
        ) : (
          feedbacks.map((row) => {
            const hasReply = Boolean(row.reply)
            return (
              <article key={row.id} className="zs-feedback-item">
                <header className="zs-feedback-item__header">
                  <div>
                    <h3>{row.customer?.name || 'Customer'}</h3>
                    <p>
                      Staff: <strong>{row.staff?.name || 'Unassigned'}</strong>
                    </p>
                    <p>{formatFullDateTime(row.appointment?.datetime)}</p>
                  </div>
                  <div className="zs-feedback-item__status">
                    <p className="zs-feedback-stars" aria-label={`Rating ${row.rating} out of 5`}>
                      {renderStars(row.rating)}
                    </p>
                    <Badge tone={statusTone(hasReply)}>{hasReply ? 'Answered' : 'Pending'}</Badge>
                  </div>
                </header>

                <p className="zs-feedback-item__comment">{shortPreview(row.comment)}</p>

                {hasReply ? <div className="zs-feedback-reply-box">{row.reply}</div> : null}

                <div className="zs-action-row">
                  <Button variant="ghost" size="sm" type="button" onClick={() => openDetails(row)}>
                    View Details
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => openDetails(row)}>
                    Reply
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </section>

      <Modal open={Boolean(selectedFeedback)} title="Feedback details" onClose={closeDetails}>
        {selectedFeedback ? (
          <div className="zs-feedback-detail">
            <div className="zs-feedback-detail__grid">
              <section>
                <h4>Customer</h4>
                <p>{selectedFeedback.customer?.name || '--'}</p>
                <p>{selectedFeedback.customer?.email || '--'}</p>
              </section>
              <section>
                <h4>Staff</h4>
                <p>{selectedFeedback.staff?.name || '--'}</p>
              </section>
              <section>
                <h4>Appointment</h4>
                <p>{formatFullDateTime(selectedFeedback.appointment?.datetime)}</p>
                <ul className="zs-list">
                  {(selectedFeedback.appointment?.services || []).map((service) => (
                    <li key={service.id}>{service.name}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h4>Feedback</h4>
                <p className="zs-feedback-stars" aria-label={`Rating ${selectedFeedback.rating} out of 5`}>
                  {renderStars(selectedFeedback.rating)}
                </p>
                <p className="zs-feedback-detail__comment">{selectedFeedback.comment || 'No comment provided.'}</p>
              </section>
            </div>

            {selectedFeedback.reply ? (
              <section className="zs-feedback-reply-box">
                <h4>Current reply</h4>
                <p>{selectedFeedback.reply}</p>
              </section>
            ) : null}

            <section className="zs-feedback-reply-editor">
              <h4>{selectedFeedback.reply ? 'Update reply' : 'Write a reply'}</h4>
              <textarea
                className="zs-textarea"
                rows={4}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="Thank you for your feedback. We appreciate your time."
              />
              <Button type="button" variant="primary" onClick={handleReplySubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Submit reply'}
              </Button>
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
