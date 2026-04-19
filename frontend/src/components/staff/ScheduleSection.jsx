import styles from './ScheduleSection.module.css'

export default function ScheduleSection({
  title,
  description,
  columns,
  rows,
  loading,
  error,
  emptyMessage = 'No data available.',
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>

      {loading ? (
        <p className={styles.stateText}>
          <span className={styles.spinner} />
          Loading...
        </p>
      ) : error ? (
        <p className={`${styles.stateText} ${styles.errorText}`}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.stateText}>{emptyMessage}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  {columns.map((column) => (
                    <td key={column.key}>{row[column.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
