// Purpose: Table of pending registration requests.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, formatAdminDate } from './adminData.js'

function RegistrationTable({ requests = [], onReview, busyId = '' }) {
  const columns = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (request) => (
        <div>
          <div className="fw-semibold">
            {displayValue(request.name || [request.firstName, request.lastName].filter(Boolean).join(' '))}
          </div>
          <div className="small text-secondary">{displayValue(request.email)}</div>
        </div>
      ),
    },
    { key: 'role', label: 'Account type' },
    { key: 'university', label: 'University', render: (request) => displayValue(request.university) },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Submitted', render: (request) => formatAdminDate(request.createdAt) },
  ]

  return (
    <AdminDataTable
      actions={(request) => {
        const id = String(request._id ?? request.id ?? '')
        return (
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-success"
              disabled={busyId === id}
              onClick={() => onReview(request, 'approved')}
              type="button"
            >
              Approve
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={busyId === id}
              onClick={() => onReview(request, 'rejected')}
              type="button"
            >
              Reject
            </button>
          </div>
        )
      }}
      columns={columns}
      emptyMessage="There are no registration requests to review."
      rows={requests}
    />
  )
}

export default RegistrationTable
