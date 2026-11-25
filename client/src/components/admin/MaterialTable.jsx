// Purpose: Administrative table of submitted materials.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, formatAdminDate } from './adminData.js'
import useLanguage from '../../hooks/useLanguage.js'

function MaterialTable({ materials = [], onReview, onView, onEdit, onDelete, busyId = '' }) {
  const { t } = useLanguage()
  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category', render: (material) => displayValue(material.category) },
    { key: 'uploadedBy', label: 'Submitted by', render: (material) => displayValue(material.uploadedBy || material.owner) },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Submitted', render: (material) => formatAdminDate(material.createdAt) },
  ]

  return (
    <AdminDataTable
      actions={(material) => {
        const id = String(material._id ?? material.id ?? '')
        const pending = !['approved', 'published'].includes(String(material.status).toLowerCase())
        return (
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onView(material)}
              type="button"
            >
              {t('View')}
            </button>
            {onEdit && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onEdit(material)}
                type="button"
              >
                {t('Edit')}
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={busyId === id}
                onClick={() => onDelete(material)}
                type="button"
              >
                {t('Delete')}
              </button>
            )}
            {pending && (
              <button
                className="btn btn-sm btn-success"
                disabled={busyId === id}
                onClick={() => onReview(material, 'approved')}
                type="button"
              >
                {t('Approve')}
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={busyId === id}
              onClick={() => onReview(material, 'rejected')}
              type="button"
            >
              {t('Reject')}
            </button>
          </div>
        )
      }}
      columns={columns}
      emptyMessage="No learning materials found."
      rows={materials}
    />
  )
}

export default MaterialTable
