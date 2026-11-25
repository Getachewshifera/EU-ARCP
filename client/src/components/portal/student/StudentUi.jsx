import React from 'react'
import useLanguage from '../../../hooks/useLanguage.js'

export function PageHeader({ title, description, actions }) {
  const { t } = useLanguage()

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{t(title)}</h1>
        {description && <p className="text-body-secondary mb-0">{t(description)}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  const { t } = useLanguage()

  return (
    <div className="d-flex align-items-center gap-2 py-4" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{t(label)}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  const { t } = useLanguage()

  return (
    <div className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2" role="alert">
      <span>{t(message)}</span>
      {onRetry && <button type="button" className="btn btn-outline-danger btn-sm align-self-start" onClick={onRetry}>{t('Try again')}</button>}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', description }) {
  const { t } = useLanguage()

  return (
    <div className="border rounded-3 bg-body-tertiary text-center px-3 py-5">
      <h2 className="h5">{t(title)}</h2>
      {description && <p className="text-body-secondary mb-0">{t(description)}</p>}
    </div>
  )
}

export function Notice({ children, variant = 'success' }) {
  const { t } = useLanguage()
  if (!children) return null
  return <div className={`alert alert-${variant}`} role={variant === 'danger' ? 'alert' : 'status'}>{t(children)}</div>
}
