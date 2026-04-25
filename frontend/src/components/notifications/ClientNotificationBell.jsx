import { useCallback, useEffect, useRef, useState } from 'react'
import businessApi from '../../Api/businessApi'

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ClientNotificationBell() {
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await businessApi.clientNotifications()
      const payload = res?.data?.data || {}
      setItems(Array.isArray(payload.notifications) ? payload.notifications : [])
      setUnreadCount(Number(payload.unread_count || 0))
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!open) return undefined

    const onClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const markRead = async (id) => {
    try {
      await businessApi.markClientNotificationRead(id)
      await load()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="zs-client-notify" ref={panelRef}>
      <button
        type="button"
        className="zs-client-notify__btn"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <IconBell />
        {unreadCount > 0 ? <span className="zs-client-notify__dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="zs-client-notify__panel" role="menu" aria-label="Notifications">
          <div className="zs-client-notify__head">
            <strong>Notifications</strong>
            <span>{unreadCount > 0 ? `${unreadCount} unread` : 'All read'}</span>
          </div>
          <div className="zs-client-notify__body">
            {loading ? (
              <p className="zs-client-notify__empty">Loading notifications...</p>
            ) : items.length === 0 ? (
              <p className="zs-client-notify__empty">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`zs-client-notify__item ${item.is_read ? '' : 'is-unread'}`.trim()}
                  onClick={() => markRead(item.id)}
                >
                  <span className="zs-client-notify__title">{item.title}</span>
                  <span className="zs-client-notify__message">{item.short_message || item.message}</span>
                  <span className="zs-client-notify__appointment">
                    Appointment time: {formatTime(item.time)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
