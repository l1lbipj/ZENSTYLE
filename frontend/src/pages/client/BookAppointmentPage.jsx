import { useState, useCallback, useEffect } from 'react'
import AppointmentForm from '../../components/forms/AppointmentForm'
import Card from '../../components/ui/Card'
import businessApi from '../../Api/businessApi'
import staffApi from '../../Api/staffApi'
import { formatUSD } from '../../utils/money'

export default function BookAppointmentPage() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [serviceOptions, setServiceOptions] = useState([])
  const [staffOptions, setStaffOptions] = useState([])

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
            label: `${item.service_name} (${formatUSD(item.price || 0, { from: 'VND' })})`,
          })),
        )
        setStaffOptions(
          staffs.map((item) => ({
            value: String(item.staff_id),
            label: item.staff_name,
          })),
        )
      } catch {
        if (!isMounted) return
        setFeedback({ type: 'error', message: 'Could not load service/staff options from server.' })
      }
    }

    loadOptions()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = useCallback(
    async (formData) => {
      setFeedback(null)
      setLoading(true)
      try {
        const startHour = formData.time
        const [h, m] = startHour.split(':').map((n) => Number(n))
        const endMinutes = h * 60 + m + 60
        const endHourText = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

        await businessApi.bookAppointment({
          appointment_date: formData.date,
          items: [
            {
              staff_id: Number(formData.staff),
              item_type: 'service',
              item_id: Number(formData.service),
              quantity: 1,
              // Backend expects `date_format:H:i`
              start_time: formData.time,
              end_time: endHourText,
            },
          ],
          payment_method: 'cash',
        })
        setFeedback({ type: 'success', message: 'Your appointment request was sent successfully.' })
      } catch (error) {
        const responseData = error?.response?.data
        const firstFieldError =
          responseData?.errors && typeof responseData.errors === 'object'
            ? Object.values(responseData.errors)?.flat?.()?.[0]
            : null
        const message =
          firstFieldError ||
          responseData?.message ||
          error?.message ||
          'Could not book appointment. Please try again.'
        setFeedback({ type: 'error', message })
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return (
    <Card title="Book an appointment" description="Choose your service, staff, and time.">
      {feedback && (
        <div
          className={feedback.type === 'error' ? 'zs-feedback zs-feedback--error' : 'zs-feedback zs-feedback--success'}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
      <AppointmentForm
        onSubmit={handleSubmit}
        loading={loading}
        serviceOptions={serviceOptions}
        staffOptions={staffOptions}
      />
    </Card>
  )
}
