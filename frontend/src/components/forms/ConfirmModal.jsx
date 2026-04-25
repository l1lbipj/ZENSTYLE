import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function ConfirmModal({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="zs-confirm-modal">
        <p className="zs-confirm-modal__message">{message}</p>
        <div className="zs-form-actions">
          <Button type="button" variant={danger ? 'primary' : 'ghost'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
