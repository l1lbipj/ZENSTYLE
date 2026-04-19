import { useEffect, useId, useRef } from 'react'

export default function Modal({ open, title, children, onClose }) {
  const titleId = useId()
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const previousActive = document.activeElement
    const t = window.setTimeout(() => closeRef.current?.focus(), 0)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
      if (previousActive instanceof HTMLElement && document.contains(previousActive)) {
        previousActive.focus()
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="zs-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="zs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <header className="zs-modal__header">
          {title ? (
            <h3 id={titleId}>{title}</h3>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className="zs-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            Close
          </button>
        </header>
        <div className="zs-modal__body">{children}</div>
      </div>
    </div>
  )
}
