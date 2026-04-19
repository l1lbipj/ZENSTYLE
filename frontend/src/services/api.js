const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function parseErrorBody(response) {
  const text = await response.text()
  if (!text) return { message: 'Request failed' }
  try {
    return JSON.parse(text)
  } catch {
    return { message: text.slice(0, 200) || 'Request failed' }
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { signal?: AbortSignal }} [options]
 */
export async function request(path, options = {}) {
  const { signal, headers: optionHeaders, ...rest } = options
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(optionHeaders || {}),
    },
    signal,
    ...rest,
  })

  if (!response.ok) {
    const error = await parseErrorBody(response)
    const message =
      typeof error.message === 'string'
        ? error.message
        : typeof error.detail === 'string'
          ? error.detail
          : 'Request failed'
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export const api = {
  login: (payload, signal) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload), signal }),
  register: (payload, signal) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload), signal }),
  forgotPassword: (payload, signal) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload), signal }),
  getAppointments: (signal) => request('/appointments', { signal }),
  bookAppointment: (payload, signal) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(payload), signal }),
}
