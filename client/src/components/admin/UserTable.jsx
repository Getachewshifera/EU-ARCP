// Purpose: Table of user accounts and administrative actions.
import { useState } from 'react'
import AdminDataTable from './AdminDataTable.jsx'
import Modal from '../common/Modal.jsx'
import { displayValue, formatAdminDate } from './adminData.js'
import { getAvatarUrl } from '../../services/studentService.js'
import useLanguage from '../../hooks/useLanguage.js'

const detailsFields = [
  ['Account ID', '_id'],
  ['First name', 'firstName'],
  ['Middle name', 'middleName'],
  ['Last name', 'lastName'],
  ['Username', 'username'],
  ['Email address', 'email'],
  ['Phone number', 'phone'],
  ['Role', 'role'],
  ['Status', 'status'],
  ['Approval status', 'approvalStatus'],
  ['Active', 'isActive'],
  ['Email verified', 'emailVerified'],
  ['Password change required', 'mustChangePassword'],
  ['University', 'university'],
  ['College', 'college'],
  ['Department', 'department'],
  ['Program', 'program'],
  ['Academic year', 'academicYear'],
  ['Identity ID', 'identityId'],
  ['Student ID', 'studentId'],
  ['Lecturer ID', 'lecturerId'],
  ['About', 'bio'],
  ['Account created', 'createdAt'],
  ['Last updated', 'updatedAt'],
  ['Password last changed', 'passwordChangedAt'],
  ['Activation expires', 'activationExpiresAt'],
]

function detailValue(user, field) {
  const value = user[field]
  if (['createdAt', 'updatedAt', 'passwordChangedAt', 'activationExpiresAt'].includes(field)) {
    return formatAdminDate(value)
  }
  return displayValue(value)
}

function UserTable({ users = [], onRoleChange, onStatusChange, onDelete, currentUserId = '', busyId = '' }) {
  const { t } = useLanguage()
  const [selectedUser, setSelectedUser] = useState(null)
  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="d-flex align-items-center gap-2">
          {user.profilePhoto
            ? <img alt="" className="rounded-circle border" height="42" src={getAvatarUrl(user.profilePhoto)} style={{ objectFit: 'cover' }} width="42" />
            : <span aria-hidden="true" className="rounded-circle bg-secondary-subtle d-inline-flex align-items-center justify-content-center fw-semibold" style={{ width: 42, height: 42 }}>
                {(user.name || user.firstName || user.email || '?').trim().slice(0, 1).toUpperCase()}
              </span>}
          <div>
            <div className="fw-semibold">{displayValue(user.name || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '))}</div>
            <div className="small text-secondary">{displayValue(user.email)}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone' },
    { key: 'university', label: 'University', render: (user) => displayValue(user.university) },
    { key: 'college', label: 'College', render: (user) => displayValue(user.college) },
    { key: 'department', label: 'Department', render: (user) => displayValue(user.department) },
    { key: 'program', label: 'Program', render: (user) => displayValue(user.program) },
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
    <>
      <AdminDataTable
        actions={(user) => {
          const id = String(user._id ?? user.id ?? '')
          const active = user.isActive !== false && user.status !== 'suspended'
          return (
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedUser(user)} type="button">
                {t('View details')}
              </button>
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
              {onDelete && (
                <button
                  className="btn btn-sm btn-danger"
                  disabled={busyId === id || id === currentUserId}
                  onClick={() => onDelete(user)}
                  title={id === currentUserId ? 'You cannot delete your own account.' : undefined}
                  type="button"
                >
                  Delete
                </button>
              )}
            </div>
          )
        }}
        columns={columns}
        emptyMessage="No user accounts found."
        rows={users}
      />
      <Modal onClose={() => setSelectedUser(null)} open={Boolean(selectedUser)} size="lg" title="User details">
        {selectedUser && (
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              {selectedUser.profilePhoto
                ? <img alt="" className="rounded-circle border" height="72" src={getAvatarUrl(selectedUser.profilePhoto)} style={{ objectFit: 'cover' }} width="72" />
                : <span aria-hidden="true" className="rounded-circle bg-secondary-subtle d-inline-flex align-items-center justify-content-center fw-semibold" style={{ width: 72, height: 72 }}>
                    {(selectedUser.name || selectedUser.firstName || selectedUser.email || '?').trim().slice(0, 1).toUpperCase()}
                  </span>}
              <div>
                <h3 className="h5 mb-1">{displayValue(selectedUser.name || [selectedUser.firstName, selectedUser.middleName, selectedUser.lastName].filter(Boolean).join(' '))}</h3>
                <div className="text-secondary">{displayValue(selectedUser.email)}</div>
                <div className="small text-secondary">{t('Profile photo')}: {selectedUser.profilePhoto ? t('Available') : t('Not provided')}</div>
              </div>
            </div>
            <dl className="row mb-0">
              {detailsFields.map(([label, field]) => (
                <div className="col-md-6 mb-3" key={field}>
                  <dt className="small text-secondary">{t(label)}</dt>
                  <dd className="mb-0 text-break">{detailValue(selectedUser, field)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </>
  )
}

export default UserTable
