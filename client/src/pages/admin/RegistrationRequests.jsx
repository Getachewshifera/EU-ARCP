// Purpose: Review and process registration requests.
import { useMemo, useState } from 'react'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import RegistrationTable from '../../components/admin/RegistrationTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'

function RegistrationRequests() {
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getRegistrationRequests)
  const [status, setStatus] = useState('pending')
  const visibleRequests = useMemo(
    () => status ? records.filter((request) => (request.status || 'pending') === status) : records,
    [records, status],
  )

  function reviewRequest(request, decision) {
    const id = request._id ?? request.id
    runAction(id, () => adminService.reviewRegistration(id, decision))
  }

  return (
    <AdminListPage
      description="Verify applicant details and approve or reject registration requests."
      loading={loading}
      onRefresh={reload}
      records={visibleRequests}
      title="Registration requests"
      toolbar={(
        <>
          <span className="fw-semibold">{visibleRequests.length} requests</span>
          <select
            aria-label="Filter registration requests by status"
            className="form-select"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All statuses</option>
          </select>
        </>
      )}
      error={error}
    >
      <RegistrationTable busyId={busyId} onReview={reviewRequest} requests={visibleRequests} />
    </AdminListPage>
  )
}

export default RegistrationRequests
