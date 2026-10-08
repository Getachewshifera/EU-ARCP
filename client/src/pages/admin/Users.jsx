// Purpose: Manage platform user accounts.
import { useMemo, useState } from 'react'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import UserTable from '../../components/admin/UserTable.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'
import { displayValue } from '../../components/admin/adminData.js'

function Users() {
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getUsers)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

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

  return (
    <AdminListPage
      description="Search accounts, assign roles, and suspend or reactivate access."
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
        onRoleChange={changeRole}
        onStatusChange={changeStatus}
        users={filteredUsers}
      />
    </AdminListPage>
  )
}

export default Users
