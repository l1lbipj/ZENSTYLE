import { useMemo } from 'react'
import { message } from 'antd'

/**
 * Global notification hook for displaying toast messages
 * Integrates with Ant Design's message component
 * 
 * Usage:
 * const notify = useNotification()
 * notify.success('Appointment booked!')
 * notify.error('Failed to checkout')
 * notify.info('Please wait...')
 * notify.warning('This action cannot be undone')
 */
export function useNotification() {
  return useMemo(
    () => ({
      success: (text, duration = 3) => {
        message.success(text, duration)
      },
      error: (text, duration = 4) => {
        message.error(text, duration)
      },
      info: (text, duration = 3) => {
        message.info(text, duration)
      },
      warning: (text, duration = 3) => {
        message.warning(text, duration)
      },
      loading: (text) => {
        return message.loading(text)
      },
    }),
    [],
  )
}

export default useNotification
