// Purpose: Loading indicator for asynchronous UI.
import useLanguage from '../../hooks/useLanguage.js'

function Loader({ label = 'Loading…', size = 'md', className = '' }) {
  const { t } = useLanguage()

  return (
    <div aria-live="polite" className={`d-flex align-items-center gap-2 text-secondary ${className}`} role="status">
      <span className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''}`} />
      <span>{t(label)}</span>
    </div>
  )
}

export default Loader
