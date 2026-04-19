import Button from '../ui/Button'

function getRowKey(row, index) {
  if (row && row.id != null) return String(row.id)
  return `row-${index}`
}

export default function DataTable({
  columns,
  data = [],
  actionsLabel = 'Actions',
  renderActions,
  emptyMessage = 'No records to display.',
  caption,
}) {
  const rows = Array.isArray(data) ? data : []

  if (rows.length === 0) {
    return (
      <div className="zs-table zs-table--empty" role="status" aria-live="polite">
        <p className="zs-table__empty">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="zs-table">
      <table>
        {caption ? <caption className="zs-table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
            <th scope="col">{actionsLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((col) => (
                <td key={col.key}>{row?.[col.key] ?? '—'}</td>
              ))}
              <td>
                {renderActions ? (
                  renderActions(row)
                ) : (
                  <div className="zs-table__actions">
                    <Button variant="ghost" size="sm" type="button">
                      View
                    </Button>
                    <Button variant="ghost" size="sm" type="button">
                      Edit
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="zs-table__footer">
        <span>Showing {rows.length} {rows.length === 1 ? 'entry' : 'entries'}</span>
        <div className="zs-table__pagination">
          <Button variant="ghost" size="sm" type="button" disabled aria-disabled="true">
            Prev
          </Button>
          <Button variant="ghost" size="sm" type="button" disabled aria-disabled="true">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
