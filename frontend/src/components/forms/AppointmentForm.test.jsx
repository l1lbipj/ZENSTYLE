import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppointmentForm from './AppointmentForm'

describe('AppointmentForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders form with all fields', () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/service/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred staff/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /book appointment/i })).toBeInTheDocument()
  })

  test('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<AppointmentForm onSubmit={mockOnSubmit} />)

    const dateInput = screen.getByLabelText(/date/i)
    const timeInput = screen.getByLabelText(/time/i)
    const submitButton = screen.getByRole('button', { name: /book appointment/i })

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const dateString = futureDate.toISOString().split('T')[0]

    await user.type(dateInput, dateString)
    await user.type(timeInput, '10:00')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      service: 'haircut',
      staff: 'any',
      date: dateString,
      time: '10:00',
    })
  })

  test('shows error for past date', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppointmentForm onSubmit={mockOnSubmit} />)

    const dateInput = screen.getByLabelText(/date/i)
    const submitButton = screen.getByRole('button', { name: /book appointment/i })
    const form = container.querySelector('form')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const dateString = pastDate.toISOString().split('T')[0]

    fireEvent.change(dateInput, { target: { value: dateString } })
    await user.click(submitButton)
    fireEvent.submit(form)

    expect(await screen.findByText(/date cannot be in the past/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('shows error for missing required fields', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppointmentForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /book appointment/i })
    const form = container.querySelector('form')

    await user.click(submitButton)
    fireEvent.submit(form)

    expect(await screen.findByText(/date is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/time is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('clears error on input change', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppointmentForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /book appointment/i })
    const form = container.querySelector('form')
    await user.click(submitButton)
    fireEvent.submit(form)

    expect(await screen.findByText(/date is required/i)).toBeInTheDocument()

    const dateInput = screen.getByLabelText(/date/i)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const dateString = futureDate.toISOString().split('T')[0]

    fireEvent.change(dateInput, { target: { value: dateString } })

    await waitFor(() => {
      expect(screen.queryByText(/date is required/i)).not.toBeInTheDocument()
    })
  })
})