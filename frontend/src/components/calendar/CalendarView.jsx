const hours = Array.from({ length: 10 }, (_, i) => `${9 + i}:00`)
const defaultColumns = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function CalendarView({ title = 'Today', columns = defaultColumns }) {
  const columnCount = columns.length
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
            {columns.map((col, index) => (
              <div
                key={`${hour}-${col}`}
                className={`zs-calendar__slot ${index === 1 && hour === '11:00' ? 'zs-calendar__slot--busy' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
