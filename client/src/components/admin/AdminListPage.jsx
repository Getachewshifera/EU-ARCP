import AdminDataTable from './AdminDataTable.jsx'
import useLanguage from '../../hooks/useLanguage.js'

function AdminListPage({
  title,
  description,
  records,
  columns,
  actions,
  loading,
  error,
  onRefresh,
  emptyMessage,
  toolbar,
  children,
}) {
  const { t } = useLanguage()

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t(title)}</h1>
          <p className="text-secondary mb-0">{t(description)}</p>
        </div>
        <button className="btn btn-outline-secondary" disabled={loading} onClick={onRefresh} type="button">
          {t('Refresh')}
        </button>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card">
        {toolbar && (
          <div className="card-header bg-white d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
            {toolbar}
          </div>
        )}
        {loading ? (
          <div className="p-4 text-secondary" role="status">{t('Loading')} {t(title.toLowerCase())}…</div>
        ) : (
          children || (
            <AdminDataTable
              actions={actions}
              columns={columns}
              emptyMessage={t(emptyMessage)}
              rows={records}
            />
          )
        )}
      </div>
    </section>
  )
}

export default AdminListPage
