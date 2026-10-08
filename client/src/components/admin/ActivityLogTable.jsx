// Purpose: Table of recorded administrative/system activity.
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, formatAdminDate } from './adminData.js'

function ActivityLogTable({ logs = [] }) {
  const columns = [
    { key: 'createdAt', label: 'Time', render: (log) => formatAdminDate(log.createdAt || log.timestamp) },
    { key: 'actor', label: 'Actor', render: (log) => displayValue(log.actor || log.user) },
    { key: 'action', label: 'Action' },
    { key: 'resource', label: 'Resource', render: (log) => displayValue(log.resource || log.target) },
    { key: 'ipAddress', label: 'IP address' },
  ]

  return (
    <AdminDataTable
      columns={columns}
      emptyMessage="No activity has been recorded."
      rows={logs}
    />
  )
}

export default ActivityLogTable
