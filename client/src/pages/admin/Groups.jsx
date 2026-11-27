import { Link } from 'react-router-dom'
import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import { displayValue, formatAdminDate } from '../../components/admin/adminData.js'
import useLanguage from '../../hooks/useLanguage.js'

const fields = [
  { name: 'name', label: 'Group name', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  {
    name: 'course',
    label: 'Course',
    maxLength: 160,
  },
  {
    name: 'groupType',
    label: 'Group type',
    type: 'select',
    defaultValue: 'custom',
    options: [
      { value: 'university', label: 'University' },
      { value: 'department', label: 'Department' },
      { value: 'course', label: 'Course' },
      { value: 'class', label: 'Class' },
      { value: 'custom', label: 'Custom' },
    ],
  },
  { name: 'isPrivate', label: 'Visibility', type: 'checkbox', checkboxLabel: 'Private group', defaultValue: false },
]

function Groups() {
  const { t } = useLanguage()
  const columns = [
    { key: 'name', label: 'Group' },
    { key: 'groupType', label: 'Type', render: (group) => t(group.groupType || 'custom') },
    { key: 'owner', label: 'Owner', render: (group) => displayValue(group.owner || group.createdBy) },
    { key: 'isPrivate', label: 'Visibility', render: (group) => t(group.isPrivate ? 'Private' : 'Public') },
    { key: 'members', label: 'Members', render: (group) => group.members?.length ?? group.memberCount ?? 0 },
    { key: 'createdAt', label: 'Created', render: (group) => formatAdminDate(group.createdAt) },
    { key: 'chat', label: 'Chat', render: (group) => <Link className="btn btn-sm btn-outline-primary" to={`/admin/groups/${group._id || group.id}/chat`}>{t('Open chat')}</Link> },
  ]

  return (
    <AdminResourcePage
      columns={columns}
      description="Review and maintain study groups across the platform."
      createLabel="Create group"
      fields={fields}
      resource="groups"
      title="Groups"
    />
  )
}

export default Groups
