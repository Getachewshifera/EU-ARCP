import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import { formatAdminDate } from '../../components/admin/adminData.js'

const fields = [
  { name: 'name', label: 'University name', required: true, maxLength: 160 },
  { name: 'code', label: 'University code', maxLength: 30 },
  { name: 'country', label: 'Country', maxLength: 100 },
  { name: 'website', label: 'Website', type: 'url', maxLength: 2048 },
  { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
]

const columns = [
  { key: 'name', label: 'University' },
  { key: 'code', label: 'Code' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website' },
  { key: 'description', label: 'Description' },
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
