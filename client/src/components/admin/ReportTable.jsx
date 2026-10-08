// Purpose: Table of reports submitted for review.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, formatAdminDate } from './adminData.js'

function ReportTable({ reports = [], onReview, busyId = '' }) {
  const columns = [
    { key: 'subject', label: 'Report', render: (report) => displayValue(report.subject || report.title || report.reason) },
    { key: 'reporter', label: 'Reported by', render: (report) => displayValue(report.reporter || report.reportedBy) },
    { key: 'target', label: 'Related to', render: (report) => displayValue(report.target || report.targetType) },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created', render: (report) => formatAdminDate(report.createdAt) },
  ]

  return (
    <AdminDataTable
      actions={(report) => {
        const id = String(report._id ?? report.id ?? '')
        return (
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-success"
              disabled={busyId === id}
              onClick={() => onReview(report, 'resolved')}
              type="button"
            >
              Resolve
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={busyId === id}
              onClick={() => onReview(report, 'dismissed')}
              type="button"
            >
              Dismiss
            </button>
          </div>
        )
      }}
      columns={columns}
      emptyMessage="No reports are waiting for review."
      rows={reports}
    />
  )
}

export default ReportTable
