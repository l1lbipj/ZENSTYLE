const hours = Array.from({ length: 10 }, (_, i) => `${9 + i}:00`)
const defaultColumns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function hourOfTimeString(value) {
  if (!value) return null
  // value may be like "2026-04-21T11:35:00" or "11:00" or "11:00:00"
  const t = typeof value === 'string' ? value : ''
  const m = t.match(/(\d{1,2}:\d{2})/) // capture HH:MM
  return m ? `${Number(m[1].split(':')[0])}:${m[1].split(':')[1]}` : null
}

export default function CalendarView({ title = 'Today', columns = defaultColumns, busyItems = [] }) {
  const columnCount = columns.length

  // build a set of busy keys like "colIndex-hour"
  const busySet = new Set()
  busyItems.forEach((item) => {
    // item may be an appointment with appointment_date, or a schedule with date + check_in
    const dateTime = item.appointment?.appointment_date || item.appointment_date || item.date || item.check_in
    const hour = hourOfTimeString(dateTime)
    if (!hour) return
    // determine day column index based on weekday of date if available
    let colIndex = null
    if (item.appointment?.appointment_date || item.appointment_date || item.date) {
      const d = new Date(item.appointment?.appointment_date || item.appointment_date || item.date)
      // getDay(): 0=Sun,1=Mon,... convert to Monday-based index 0..6 where 0=Mon
      const jsDay = d.getDay()
      colIndex = jsDay === 0 ? 6 : jsDay - 1
    } else if (item.shift_id || item.shift || item.check_in) {
      // fallback: if only time is provided, we can't compute a day - skip
      colIndex = null
    }

    if (colIndex !== null && colIndex >= 0 && colIndex < columns.length) {
      busySet.add(`${colIndex}-${hour}`)
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
              const busy = busySet.has(key)
              return <div key={`${hour}-${col}`} className={`zs-calendar__slot ${busy ? 'zs-calendar__slot--busy' : ''}`} />
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
