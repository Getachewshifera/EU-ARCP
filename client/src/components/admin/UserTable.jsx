// Purpose: Table of user accounts and administrative actions.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue } from './adminData.js'

function UserTable({ users = [], onRoleChange, onStatusChange, busyId = '' }) {
  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div>
          <div className="fw-semibold">
            {displayValue(user.name || [user.firstName, user.lastName].filter(Boolean).join(' '))}
          </div>
          <div className="small text-secondary">{displayValue(user.email)}</div>
        </div>
      ),
    },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className={`badge ${user.isActive === false || user.status === 'suspended' ? 'text-bg-secondary' : 'text-bg-success'}`}>
          {user.isActive === false ? 'Inactive' : displayValue(user.status || 'Active')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (user) => user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—',
    },
  ]

  return (
    <AdminDataTable
      actions={(user) => {
        const id = String(user._id ?? user.id ?? '')
        const active = user.isActive !== false && user.status !== 'suspended'
        return (
          <div className="d-flex justify-content-end gap-2">
            {onRoleChange && (
              <select
                aria-label={`Change role for ${user.email || id}`}
                className="form-select form-select-sm"
                disabled={busyId === id}
                onChange={(event) => onRoleChange(user, event.target.value)}
                value={user.role || 'student'}
              >
                {['student', 'lecturer', 'admin'].map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            )}
            {onStatusChange && (
              <button
                className={`btn btn-sm ${active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                disabled={busyId === id}
                onClick={() => onStatusChange(user, active ? 'suspended' : 'active')}
                type="button"
              >
                {busyId === id ? 'Saving…' : active ? 'Suspend' : 'Activate'}
              </button>
            )}
          </div>
        )
      }}
      columns={columns}
      emptyMessage="No user accounts found."
      rows={users}
    />
  )
}

export default UserTable
