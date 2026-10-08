// Purpose: Review platform activity records.
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import ActivityLogTable from '../../components/admin/ActivityLogTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'

function ActivityLogs() {
  const { records, loading, error, reload } = useAdminRecords(adminService.getActivityLogs)

  return (
    <AdminListPage
      description="Audit administrative and platform activity."
      loading={loading}
      onRefresh={reload}
      records={records}
      title="Activity logs"
      toolbar={<span className="fw-semibold">{records.length} events</span>}
      error={error}
    >
      <ActivityLogTable logs={records} />
    </AdminListPage>
  )
}

export default ActivityLogs
