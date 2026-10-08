// Purpose: Confirmation prompt for potentially consequential actions.
import Modal from './Modal.jsx'
import Button from './Button.jsx'

function ConfirmDialog({
  open,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal onClose={loading ? undefined : onCancel} open={open} title={title} size="sm">
      <p>{message}</p>
      <div className="d-flex justify-content-end gap-2">
        <Button disabled={loading} onClick={onCancel} variant="outline-secondary">{cancelLabel}</Button>
        <Button loading={loading} onClick={onConfirm} variant={destructive ? 'danger' : 'primary'}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
