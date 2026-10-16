// Purpose: Manage platform user accounts.
import { useMemo, useState } from 'react'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import UserTable from '../../components/admin/UserTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'
import { displayValue } from '../../components/admin/adminData.js'
import useAuth from '../../hooks/useAuth.js'

function Users() {
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getUsers)
  const { user: currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return records.filter((user) => {
      const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ')
      const matchesQuery = !normalizedQuery
        || `${displayValue(name)} ${displayValue(user.email)}`.toLowerCase().includes(normalizedQuery)
      const matchesRole = !role || user.role === role
      const matchesStatus = !status || (status === 'active'
        ? user.isActive !== false && user.status !== 'suspended'
        : user.isActive === false || user.status === 'suspended')
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [query, records, role, status])

  function changeRole(user, nextRole) {
    if (user.role === nextRole) return
    const id = user._id ?? user.id
    runAction(id, () => adminService.updateUser(id, { role: nextRole }))
  }

  function changeStatus(user, nextStatus) {
    const id = user._id ?? user.id
    runAction(id, () => adminService.updateUser(id, { status: nextStatus }))
  }

  async function deleteUser() {
    const id = deleteTarget?._id ?? deleteTarget?.id
    if (!id) return
    const deleted = await runAction(id, () => adminService.deleteUser(id))
    if (deleted) setDeleteTarget(null)
  }

  return (
    <AdminListPage
      description="Search accounts, assign roles, suspend or reactivate access, and permanently delete accounts."
      emptyMessage="No user accounts match these filters."
      loading={loading}
      onRefresh={reload}
      records={filteredUsers}
      title="Users"
      toolbar={(
        <>
          <span className="fw-semibold">{filteredUsers.length} users</span>
          <div className="d-flex flex-wrap gap-2">
            <input
              aria-label="Search users"
              className="form-control"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
              type="search"
              value={query}
            />
            <select aria-label="Filter by role" className="form-select" onChange={(event) => setRole(event.target.value)} value={role}>
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
            <select aria-label="Filter by status" className="form-select" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </>
      )}
      error={error}
    >
      <UserTable
        busyId={busyId}
        currentUserId={String(currentUser?._id ?? currentUser?.id ?? '')}
        onDelete={setDeleteTarget}
        onRoleChange={changeRole}
        onStatusChange={changeStatus}
        users={filteredUsers}
      />
      <ConfirmDialog
        confirmLabel="Delete user"
        destructive
        loading={Boolean(deleteTarget && busyId === String(deleteTarget._id ?? deleteTarget.id))}
        message={`Permanently delete ${displayValue(deleteTarget?.name || deleteTarget?.email)} and their account data? This also removes their uploaded materials, messages, and groups. This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
        open={Boolean(deleteTarget)}
        title="Delete user"
      />
    </AdminListPage>
  )
}

export default Users
