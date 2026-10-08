// Purpose: Moderate and manage platform materials.
import { useMemo, useState } from 'react'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import MaterialTable from '../../components/admin/MaterialTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'

function Materials() {
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getMaterials)
  const [status, setStatus] = useState('')
  const materials = useMemo(
    () => status ? records.filter((item) => (item.status || 'pending') === status) : records,
    [records, status],
  )

  function reviewMaterial(material, nextStatus) {
    const id = material._id ?? material.id
    runAction(id, () => adminService.updateMaterial(id, { status: nextStatus }))
  }

  return (
    <AdminListPage
      description="Review submitted learning materials and control their publication status."
      loading={loading}
      onRefresh={reload}
      records={materials}
      title="Materials"
      toolbar={(
        <>
          <span className="fw-semibold">{materials.length} materials</span>
          <select aria-label="Filter materials by status" className="form-select" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </>
      )}
      error={error}
    >
      <MaterialTable busyId={busyId} materials={materials} onReview={reviewMaterial} />
    </AdminListPage>
  )
}

export default Materials
