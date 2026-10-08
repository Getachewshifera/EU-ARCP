// Purpose: Reusable modal dialog container.
import { useEffect } from 'react'

function Modal({ open, title, onClose, children, size = 'md', labelledBy = 'modal-title' }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="modal d-block"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}
      role="presentation"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div aria-labelledby={labelledBy} aria-modal="true" className={`modal-dialog modal-${size} modal-dialog-centered`} role="dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title fs-5" id={labelledBy}>{title}</h2>
            <button aria-label="Close" className="btn-close" onClick={onClose} type="button" />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal
