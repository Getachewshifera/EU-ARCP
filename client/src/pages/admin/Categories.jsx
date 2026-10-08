import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import { formatAdminDate } from '../../components/admin/adminData.js'

const fields = [
  { name: 'name', label: 'Category name', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
]

const columns = [
  { key: 'name', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Added', render: (category) => formatAdminDate(category.createdAt) },
]

function Categories() {
  return (
    <AdminResourcePage
      columns={columns}
      description="Organize platform materials with reusable categories."
      fields={fields}
      resource="categories"
      title="Categories"
    />
  )
}

export default Categories
