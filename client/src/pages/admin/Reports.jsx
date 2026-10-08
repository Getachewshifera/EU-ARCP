// Purpose: Review and process user-submitted reports.
import { useMemo, useState } from 'react'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import ReportTable from '../../components/admin/ReportTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'

function Reports() {
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getReports)
  const [status, setStatus] = useState('open')
  const reports = useMemo(
    () => status ? records.filter((report) => (report.status || 'open') === status) : records,
    [records, status],
  )

  function reviewReport(report, nextStatus) {
    const id = report._id ?? report.id
    runAction(id, () => adminService.updateReport(id, { status: nextStatus }))
  }

  return (
    <AdminListPage
      description="Review abuse and content reports, then resolve or dismiss each case."
      loading={loading}
      onRefresh={reload}
      records={reports}
      title="Reports"
      toolbar={(
        <>
          <span className="fw-semibold">{reports.length} reports</span>
          <select aria-label="Filter reports by status" className="form-select" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All statuses</option>
          </select>
        </>
      )}
      error={error}
    >
      <ReportTable busyId={busyId} onReview={reviewReport} reports={reports} />
    </AdminListPage>
  )
}

export default Reports
