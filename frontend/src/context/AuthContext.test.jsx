import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clearStore: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clearStore()
    vi.clearAllMocks()
  })

  test('starts logged out when storage is empty', () => {
    function TestComponent() {
      const { user } = useAuth()
      return <div>{user ? 'Logged in' : 'Not logged in'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    expect(screen.getByText('Not logged in')).toBeInTheDocument()
  })

  test('login with valid data persists user', async () => {
    const user = userEvent.setup()

    function TestComponent() {
      const { login, user: u } = useAuth()
      return (
        <div>
          <button
            type="button"
            onClick={() => login({ email: 'test@example.com', password: 'password', role: 'client' })}
          >
            Login
          </button>
          <span data-testid="email">{u?.email ?? ''}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('test@example.com')
    })
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('login with invalid data does not persist', async () => {
    const user = userEvent.setup()

    function TestComponent() {
      const { login } = useAuth()
      return (
        <button
          type="button"
          onClick={() => {
            login({ email: '', password: '', role: 'client' }).catch(() => {})
          }}
        >
          Login
        </button>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })
})
