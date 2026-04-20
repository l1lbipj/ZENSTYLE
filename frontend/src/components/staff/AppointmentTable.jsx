import styles from './AppointmentTable.module.css'

function badgeClass(status) {
  if (status === 'completed') return `${styles.badge} ${styles.completed}`
  if (status === 'cancelled') return `${styles.badge} ${styles.cancelled}`
  return `${styles.badge} ${styles.pending}`
}

export default function AppointmentTable({
  title,
  description,
  filters,
  activeFilter,
  onFilterChange,
  loading,
  error,
  rows,
  page,
  totalPages,
  totalItems,
  onPrevPage,
  onNextPage,
  actionRenderer,
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.filters}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.chip} ${activeFilter === item.id ? styles.chipActive : ''}`}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className={styles.muted}>Loading appointment history...</p>
      ) : error ? (
        <p className={styles.muted}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No data available.</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Allergies</th>
                  <th>Service</th>
                  <th>Date time</th>
                  <th>Status</th>
                  {actionRenderer ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.customerName}</td>
                    <td>{item.phone}</td>
                    <td>
                      {Array.isArray(item.allergies) && item.allergies.length > 0 ? (
                        <div className={styles.allergyWrap}>
                          {item.allergies.map((allergy) => (
                            <span key={`${item.id}-${allergy}`} className={styles.allergyBadge}>
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.noAllergy}>None</span>
                      )}
                    </td>
                    <td>{item.serviceName}</td>
                    <td>{item.datetime}</td>
                    <td>
                      <span className={badgeClass(item.status)}>{item.status}</span>
                    </td>
                    {actionRenderer ? <td>{actionRenderer(item)}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <span className={styles.muted}>
              Showing {rows.length} of {totalItems} entries
            </span>
            <div className={styles.actions}>
              <button type="button" className={styles.button} disabled={page <= 1} onClick={onPrevPage}>
                Prev
              </button>
              <span className={styles.muted}>
                Page {page}/{totalPages}
              </span>
              <button type="button" className={styles.button} disabled={page >= totalPages} onClick={onNextPage}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
