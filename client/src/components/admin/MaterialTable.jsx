// Purpose: Administrative table of submitted materials.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, formatAdminDate } from './adminData.js'

function MaterialTable({ materials = [], onReview, busyId = '' }) {
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
            {pending && (
              <button
                className="btn btn-sm btn-success"
                disabled={busyId === id}
                onClick={() => onReview(material, 'approved')}
                type="button"
              >
                Approve
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={busyId === id}
              onClick={() => onReview(material, 'rejected')}
              type="button"
            >
              Reject
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
