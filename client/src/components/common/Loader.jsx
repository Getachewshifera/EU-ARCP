// Purpose: Loading indicator for asynchronous UI.
function Loader({ label = 'Loading…', size = 'md', className = '' }) {
  return (
    <div aria-live="polite" className={`d-flex align-items-center gap-2 text-secondary ${className}`} role="status">
      <span className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''}`} />
      <span>{label}</span>
    </div>
  )
}

export default Loader
