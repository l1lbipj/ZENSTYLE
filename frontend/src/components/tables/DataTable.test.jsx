import { render, screen } from '@testing-library/react'
import DataTable from './DataTable'

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
  ]

  test('shows empty state when no rows', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('renders table with caption and headers', () => {
    render(
      <DataTable
        caption="Test list"
        columns={columns}
        data={[{ id: 1, name: 'A', status: 'ok' }]}
      />,
    )
    expect(screen.getByRole('table', { name: 'Test list' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  test('renders em dash for missing cell value', () => {
    render(<DataTable columns={columns} data={[{ id: 9, name: 'B' }]} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
