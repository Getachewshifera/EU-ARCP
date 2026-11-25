import useLanguage from '../../../hooks/useLanguage.js'

export function PageHeader({ title, description, actions }) {
  const { t } = useLanguage()

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{t(title)}</h1>
        {description && <p className="text-secondary mb-0">{t(description)}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function RequestState({ loading, error, onRetry }) {
  const { t } = useLanguage()
  if (loading) return <div className="card card-body text-secondary" role="status">{t('Loading…')}</div>
  if (!error) return null
  return (
    <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
      <span>{t(error)}</span>
      {onRetry && <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>{t('Retry')}</button>}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', children }) {
  const { t } = useLanguage()

  return (
    <div className="text-center text-secondary py-5">
      <h2 className="h5 text-body">{t(title)}</h2>
      {children && <p className="mb-0">{t(children)}</p>}
    </div>
  )
}
