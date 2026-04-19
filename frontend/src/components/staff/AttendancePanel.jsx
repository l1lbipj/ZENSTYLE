import styles from './AttendancePanel.module.css'

function toneClass(status) {
  if (status === 'checked_out' || status === 'present') return `${styles.badge} ${styles.success}`
  if (status === 'checked_in' || status === 'late') return `${styles.badge} ${styles.warning}`
  return `${styles.badge} ${styles.danger}`
}

export default function AttendancePanel({
  todayTitle,
  todayDescription,
  todayStatus,
  checkInText,
  checkOutText,
  canCheckIn,
  canCheckOut,
  attendanceLoading,
  onCheckIn,
  onCheckOut,
  historyRows,
  historyPage,
  historyTotalPages,
  onHistoryPrev,
  onHistoryNext,
}) {
  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <h3 className={styles.title}>{todayTitle}</h3>
        <p className={styles.description}>{todayDescription}</p>

        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={toneClass(todayStatus)}>{todayStatus.replace('_', ' ')}</span>
        </div>

        <div className={styles.times}>
          <p className={styles.timeLine}>Check-in: {checkInText}</p>
          <p className={styles.timeLine}>Check-out: {checkOutText}</p>
        </div>

        <div className={styles.buttons}>
          <button type="button" className={styles.primaryButton} disabled={!canCheckIn || attendanceLoading} onClick={onCheckIn}>
            Check In
          </button>
          <button type="button" className={styles.secondaryButton} disabled={!canCheckOut || attendanceLoading} onClick={onCheckOut}>
            Check Out
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.title}>Attendance history</h3>
        <p className={styles.description}>Recent attendance records</p>

        {historyRows.length === 0 ? (
          <p className={styles.muted}>No data available.</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((item) => (
                    <tr key={item.key}>
                      <td>{item.date}</td>
                      <td>{item.checkIn}</td>
                      <td>{item.checkOut}</td>
                      <td>
                        <span className={toneClass(item.status)}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.footer}>
              <span className={styles.muted}>Showing {historyRows.length} entries</span>
              <div className={styles.pager}>
                <button type="button" className={styles.pagerBtn} disabled={historyPage <= 1} onClick={onHistoryPrev}>
                  Prev
                </button>
                <span className={styles.muted}>
                  Page {historyPage}/{historyTotalPages}
                </span>
                <button type="button" className={styles.pagerBtn} disabled={historyPage >= historyTotalPages} onClick={onHistoryNext}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
