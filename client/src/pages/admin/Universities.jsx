import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import { formatAdminDate } from '../../components/admin/adminData.js'

const fields = [
  { name: 'name', label: 'University name', required: true },
  { name: 'country', label: 'Country' },
  { name: 'website', label: 'Website', type: 'url' },
]

const columns = [
  { key: 'name', label: 'University' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website' },
  { key: 'createdAt', label: 'Added', render: (university) => formatAdminDate(university.createdAt) },
]

function Universities() {
  return (
    <AdminResourcePage
      columns={columns}
      description="Maintain the universities available in the academic directory."
      fields={fields}
      resource="universities"
      title="Universities"
    />
  )
}

export default Universities
