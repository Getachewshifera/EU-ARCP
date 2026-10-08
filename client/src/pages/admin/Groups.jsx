import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import { displayValue, formatAdminDate } from '../../components/admin/adminData.js'

const fields = [
  { name: 'name', label: 'Group name', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  {
    name: 'visibility',
    label: 'Visibility',
    type: 'select',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
  },
]

const columns = [
  { key: 'name', label: 'Group' },
  { key: 'owner', label: 'Owner', render: (group) => displayValue(group.owner || group.createdBy) },
  { key: 'visibility', label: 'Visibility' },
  { key: 'members', label: 'Members', render: (group) => group.members?.length ?? group.memberCount ?? 0 },
  { key: 'createdAt', label: 'Created', render: (group) => formatAdminDate(group.createdAt) },
]

function Groups() {
  return (
    <AdminResourcePage
      columns={columns}
      description="Review and maintain study groups across the platform."
      fields={fields}
      resource="groups"
      title="Groups"
    />
  )
}

export default Groups
