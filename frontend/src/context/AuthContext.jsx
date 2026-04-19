import { useMemo, useState, useCallback, useEffect } from 'react'
import { AuthContext } from './AuthContextValue'
import { normalizeRole } from '../routes/roleConfig'
import { useAuthMock } from '../config/env'
import authApi from '../Api/authApi'
import { logout as clearStoredAuth, setAuth } from '../utils/auth'
import { readAuthUser, writeAuthUser } from '../lib/authStorage'
const AUTH_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 500

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function userFromProfile(profileResponse) {
  const payload = profileResponse?.data?.data || profileResponse?.data || {}
  const user = payload.user || null
  const userType = normalizeRole(payload.user_type || 'client')
  const email = typeof user?.email === 'string' ? user.email.trim() : ''
  const name =
    typeof user?.client_name === 'string'
      ? user.client_name.trim()
      : typeof user?.staff_name === 'string'
        ? user.staff_name.trim()
        : typeof user?.admin_name === 'string'
          ? user.admin_name.trim()
          : ''
  const id = user?.client_id ?? user?.staff_id ?? user?.admin_id ?? email

  return {
    id: id || email,
    name: name || email.split('@')[0] || 'User',
    email,
    role: userType,
    rawUser: user,
    userType,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readAuthUser())
  const [loading] = useState(false)

  const persist = useCallback((nextUser) => {
    setUser(nextUser)
    try {
      writeAuthUser(nextUser)
    } catch (error) {
      console.error('Failed to persist auth', error)
      setUser(null)
    }
  }, [])

  const mockLogin = useCallback(
    async ({ email, password, role }) => {
      await delay(AUTH_DELAY_MS)
      if (!email?.trim() || !password) {
        throw new Error('Email and password are required')
      }
      const normalizedRole = normalizeRole(role)
      const nextUser = {
        id: `mock-${email}`,
        name: email.split('@')[0] || 'ZenStyle User',
        email: email.trim(),
        role: normalizedRole,
      }
      persist(nextUser)
      return nextUser
    },
    [persist],
  )

  const realLogin = useCallback(
    async ({ email, password }, signal) => {
      if (signal?.aborted) {
        const err = new Error('Aborted')
        err.name = 'AbortError'
        throw err
      }

      const loginResponse = await authApi.login({ email: email?.trim(), password })
      const loginPayload = loginResponse?.data?.data || loginResponse?.data || {}

      // Persist token so axiosClient can attach Authorization header
      setAuth(loginResponse?.data)

      const profileResponse = await authApi.profile()
      const profileUser = userFromProfile(profileResponse)

      setAuth({
        access_token: loginPayload.access_token,
        token_type: loginPayload.token_type || 'Bearer',
        user_type: profileUser.userType,
        user: profileUser.rawUser,
      })

      const nextUser = {
        id: profileUser.id,
        name: profileUser.name,
        email: profileUser.email,
        role: profileUser.role,
      }

      // Keep AuthContext in sync (readAuthUser can also parse token payload)
      setUser(nextUser)
      return nextUser
    },
    [],
  )

  const login = useCallback(
    async (credentials) => {
      if (useAuthMock) {
        return mockLogin(credentials)
      }
      return realLogin(credentials)
    },
    [mockLogin, realLogin],
  )

  const mockRegister = useCallback(
    async ({ name, email, password, role }) => {
      await delay(AUTH_DELAY_MS)
      if (!name?.trim() || !email?.trim() || !password) {
        throw new Error('Name, email, and password are required')
      }
      const nextUser = {
        id: `mock-${email}`,
        name: name.trim(),
        email: email.trim(),
        role: normalizeRole(role),
      }
      persist(nextUser)
      return nextUser
    },
    [persist],
  )

  const realRegister = useCallback(
    async ({ name, email, phone, dob, password, confirmPassword, role }) => {
      const normalizedRole = normalizeRole(role)
      const trimmedEmail = email?.trim()
      const trimmedName = name?.trim()

      if (normalizedRole !== 'client') {
        throw new Error('Self-registration is currently available for client accounts only.')
      }

      await authApi.register({
        type: 'client',
        client_name: trimmedName,
        email: trimmedEmail,
        phone: phone?.trim() || undefined,
        dob: dob || undefined,
        password,
        password_confirmation: confirmPassword,
      })

      return realLogin({ email: trimmedEmail, password })
    },
    [realLogin],
  )

  const register = useCallback(
    async (payload) => {
      if (useAuthMock) {
        return mockRegister(payload)
      }
      return realRegister(payload)
    },
    [mockRegister, realRegister],
  )

  const logout = useCallback(async () => {
    try {
      if (!useAuthMock) {
        await authApi.logout()
      }
    } catch {
      // ignore
    } finally {
      clearStoredAuth()
      persist(null)
    }
  }, [persist])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  useEffect(() => {
    const sync = () => {
      setUser(readAuthUser())
    }
    window.addEventListener('zs-auth-changed', sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener('zs-auth-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
