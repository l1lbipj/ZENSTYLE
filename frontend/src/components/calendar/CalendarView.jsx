const BUSINESS_START_HOUR = 7
const BUSINESS_END_HOUR = 22
const hours = Array.from({ length: BUSINESS_END_HOUR - BUSINESS_START_HOUR }, (_, i) => `${BUSINESS_START_HOUR + i}:00`)
const defaultColumns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function hourOfTimeString(value) {
  if (!value) return null
  // value may be like "2026-04-21T11:35:00" or "11:00" or "11:00:00"
  const t = typeof value === 'string' ? value : ''
  const m = t.match(/(\d{1,2}:\d{2})/) // capture HH:MM
  return m ? `${Number(m[1].split(':')[0])}:${m[1].split(':')[1]}` : null
}

function minutesOfTimeString(value) {
  const normalized = hourOfTimeString(value)
  if (!normalized) return null
  const [hour, minute] = normalized.split(':')
  return (Number(hour) * 60) + Number(minute)
}

function getDayIndex(item) {
  const source = item?.appointment?.appointment_date || item?.appointment_date || item?.date
  if (!source) return null
  const d = new Date(source)
  if (Number.isNaN(d.getTime())) return null
  const jsDay = d.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

export default function CalendarView({ title = 'Today', columns = defaultColumns, busyItems = [], onBusyItemClick }) {
  const columnCount = columns.length

  const busyMap = new Map()
  busyItems.forEach((item) => {
    const colIndex = getDayIndex(item)
    if (colIndex === null || colIndex < 0 || colIndex >= columns.length) return

    const startMinutes = minutesOfTimeString(item.start_time || item.appointment?.start_time || item.check_in || item.appointment?.appointment_date || item.appointment_date || item.date)
    const endMinutes = minutesOfTimeString(item.end_time || item.appointment?.end_time || item.check_out || item.appointment?.appointment_date || item.appointment_date || item.date)
    const fallbackHour = hourOfTimeString(item.appointment?.appointment_date || item.appointment_date || item.date || item.check_in)
    const label = item.label || item.service_name || item.appointment?.service_name || item.appointment?.service?.service_name || 'Busy'

    if (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) {
      hours.forEach((hourLabel) => {
        const hour = Number(hourLabel.split(':')[0])
        const slotStart = hour * 60
        const slotEnd = slotStart + 60
        if (startMinutes < slotEnd && endMinutes > slotStart) {
          const key = `${colIndex}-${hourLabel}`
          if (!busyMap.has(key)) busyMap.set(key, [])
          busyMap.get(key).push({ ...item, label })
        }
      })
      return
    }

    if (fallbackHour) {
      const key = `${colIndex}-${fallbackHour}`
      if (!busyMap.has(key)) busyMap.set(key, [])
      busyMap.get(key).push({ ...item, label })
    }
  })

  return (
    <section className="zs-calendar" style={{ '--cols': columnCount }}>
      <header className="zs-calendar__header">
        <h3>{title}</h3>
        <div className="zs-calendar__legend">
          <span className="zs-calendar__legend-item">
            <i className="zs-calendar__dot" /> Available
          </span>
          <span className="zs-calendar__legend-item">
            <i className="zs-calendar__dot zs-calendar__dot--busy" /> Busy
          </span>
        </div>
      </header>
      <div className="zs-calendar__head">
        <span />
        {columns.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
      <div className="zs-calendar__grid">
        {hours.map((hour) => (
          <div key={hour} className="zs-calendar__row">
            <span className="zs-calendar__time">{hour}</span>
            {columns.map((col, index) => {
              const key = `${index}-${hour}`
              const busyItemsForSlot = busyMap.get(key) || []
              const busy = busyItemsForSlot.length > 0
              const slotLabel = busy ? busyItemsForSlot[0].label : ''
              const slotMeta = busy ? busyItemsForSlot[0] : null
              return busy ? (
                <button
                  key={`${hour}-${col}`}
                  type="button"
                  className="zs-calendar__slot zs-calendar__slot--busy zs-calendar__slot--clickable"
                  title={slotLabel}
                  onClick={() => onBusyItemClick?.(slotMeta, busyItemsForSlot)}
                >
                  <span className="zs-calendar__slot-label">{slotLabel}</span>
                  {busyItemsForSlot.length > 1 ? <span className="zs-calendar__slot-count">+{busyItemsForSlot.length - 1}</span> : null}
                </button>
              ) : (
                <div key={`${hour}-${col}`} className="zs-calendar__slot" />
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
