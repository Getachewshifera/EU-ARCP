import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'

const fields = [
  { name: 'key', label: 'Setting key', required: true },
  { name: 'value', label: 'Value', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
]

const columns = [
  { key: 'key', label: 'Setting' },
  { key: 'value', label: 'Value' },
  { key: 'description', label: 'Description' },
]

function SystemSettings() {
  return (
    <AdminResourcePage
      columns={columns}
      createLabel="Add setting"
      description="Configure platform-wide values exposed by the administration API."
      fields={fields}
      resource="settings"
      title="System settings"
    />
  )
}

export default SystemSettings
