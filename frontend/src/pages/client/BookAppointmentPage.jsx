import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppointmentForm from '../../components/forms/AppointmentForm'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import useNotification from '../../hooks/useNotification'
import businessApi from '../../Api/businessApi'
import staffApi from '../../Api/staffApi'
import { formatUSD } from '../../utils/money'

export default function BookAppointmentPage() {
  const notify = useNotification()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
const [serviceOptions, setServiceOptions] = useState([])
  const [staffOptions, setStaffOptions] = useState([])
  const [serviceDurationById, setServiceDurationById] = useState({})

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          businessApi.services({ per_page: 100 }),
          staffApi.getAll(),
        ])

        const services = servicesRes?.data?.data?.data || []
        const staffs = staffRes?.data?.data?.data || []

        if (!isMounted) return

        setServiceOptions(
          services.map((item) => ({
            value: String(item.service_id),
            label: `${item.service_name} (${formatUSD(item.price || 0, { from: 'USD' })})`,
          })),
        )
        setServiceDurationById(
          services.reduce((acc, item) => {
            acc[String(item.service_id)] = Number(item.duration) || 60
            return acc
          }, {}),
        )
        setStaffOptions(
          staffs.map((item) => ({
            value: String(item.staff_id),
            label: item.staff_name,
          })),
        )
      } catch {
        if (!isMounted) return
        notify.error('Could not load service and staff options right now.')
        setFeedback({ type: 'error', message: 'Could not load service and staff options right now.' })
      }
    }

    loadOptions()
    return () => {
      isMounted = false
    }
  }, [notify])

  const handleSubmit = useCallback(
    async (formData) => {
      setFeedback(null)
      setLoading(true)
      try {
        if (!Array.isArray(formData.services) || formData.services.length > 3) {
          throw new Error('You can select up to 3 services per appointment.')
        }

        const seenSlots = new Set()
        const items = formData.services.map((serviceRow, index) => {
          const [h, m] = serviceRow.time.split(':').map((n) => Number(n))
          const duration = serviceDurationById[serviceRow.service] || 60
          const startMinutes = h * 60 + m
          const endMinutes = h * 60 + m + duration
          if (Number.isNaN(h) || Number.isNaN(m)) {
            throw new Error(`Service #${index + 1} has an invalid start time.`)
          }
          if (startMinutes < 7 * 60 || endMinutes > 22 * 60) {
            throw new Error(`Service #${index + 1} must stay within business hours (07:00 AM - 10:00 PM).`)
          }

          const endHourText = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
          const slotKey = `${serviceRow.staff}-${serviceRow.time}-${endHourText}`
          if (seenSlots.has(slotKey)) {
            throw new Error(`Duplicate time slot detected for service #${index + 1}. Please choose a different time.`)
          }
          seenSlots.add(slotKey)

          return {
            staff_id: Number(serviceRow.staff),
            item_type: 'service',
            item_id: Number(serviceRow.service),
            quantity: 1,
            start_time: serviceRow.time,
            end_time: endHourText,
          }
        })

        const response = await businessApi.bookAppointment({
          appointment_date: formData.date,
          items,
          payment_method: 'cash',
        })
        
        setFeedback({ type: 'success', message: 'Your appointment request was sent successfully.' })
        notify.success(`Appointment #${response?.data?.data?.appointment_id} booked successfully!`)
      } catch (error) {
        const responseData = error?.response?.data
        const firstFieldError =
          responseData?.errors && typeof responseData.errors === 'object'
            ? Object.values(responseData.errors)?.flat?.()?.[0]
            : null
        const errorCode = responseData?.code ? ` (${responseData.code})` : ''
        const message =
          firstFieldError ||
          (responseData?.message ? `${responseData.message}${errorCode}` : null) ||
          error?.message ||
          'Could not book appointment. Please try again.'
        setFeedback({ type: 'error', message })
        notify.error(message)
      } finally {
        setLoading(false)
      }
    },
    [notify, serviceDurationById],
  )

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Book an appointment"
        subtitle="Plan your visit in a few steps with clear service details, staff assignment, and preferred schedule."
        action={
          <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
            View my appointments
          </Link>
        }
      />

      {feedback && (
        <div
          className={feedback.type === 'error' ? 'zs-feedback zs-feedback--error' : 'zs-feedback zs-feedback--success'}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      <div className="zs-dashboard__row">
        <Card title="Booking checklist" description="Everything your team needs for a smooth appointment.">
          <ul className="zs-list">
            <li>Choose up to 3 services in one booking request.</li>
            <li>Assign a preferred staff member for each service.</li>
            <li>Select practical start times to avoid scheduling conflicts.</li>
          </ul>
        </Card>
        <Card title="Need support?" description="Useful shortcuts before or after booking.">
          <div className="zs-action-row">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/profile">
              My account
            </Link>
            <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
              Appointment history
            </Link>
          </div>
        </Card>
      </div>

      <Section title="Appointment workspace" description="Complete each service block and confirm your booking request.">
        <AppointmentForm
          onSubmit={handleSubmit}
          loading={loading}
          serviceOptions={serviceOptions}
          staffOptions={staffOptions}
          serviceDurationById={serviceDurationById}
        />
      </Section>
    </div>
  )
}
