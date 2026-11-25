import { useState } from 'react'
import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import useTheme from '../../hooks/useTheme.js'

const DEFAULT_APPEARANCE = {
  primaryColor: '#2563eb',
  backgroundColor: '#f4f7fb',
}

const DEFAULT_MAINTENANCE_MESSAGE = 'The platform is temporarily unavailable while scheduled maintenance is in progress. Please try again later.'

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

function AppearanceSettings({ appearance, appearanceError, updateAppearance }) {
  const [form, setForm] = useState(appearance)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setSuccess('')
  }

  async function saveAppearance(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateAppearance(form)
      setSuccess('Appearance settings saved and applied across the site.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to save appearance settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card appearance-settings-card mb-4" aria-labelledby="appearance-heading">
      <div className="card-body">
        <div className="mb-4">
          <h2 className="h5 mb-1" id="appearance-heading">Site appearance</h2>
          <p className="text-secondary mb-0">These colors apply globally. The background color is used in light mode.</p>
        </div>
        {appearanceError && <div className="alert alert-warning" role="status">{appearanceError}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        <form onSubmit={saveAppearance}>
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-lg-4">
              <label className="form-label fw-semibold" htmlFor="site-primary-color">Primary system color</label>
              <div className="input-group">
                <input aria-label="Primary system color" className="form-control form-control-color" id="site-primary-color" name="primaryColor" onChange={updateField} type="color" value={form.primaryColor} />
                <span className="input-group-text">{form.primaryColor}</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-4">
              <label className="form-label fw-semibold" htmlFor="site-background-color">Light background color</label>
              <div className="input-group">
                <input aria-label="Light background color" className="form-control form-control-color" id="site-background-color" name="backgroundColor" onChange={updateField} type="color" value={form.backgroundColor} />
                <span className="input-group-text">{form.backgroundColor}</span>
              </div>
            </div>
            <div className="col-lg-4 d-flex gap-2">
              <button className="btn btn-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save appearance'}</button>
              <button className="btn btn-outline-secondary" onClick={() => { setForm(DEFAULT_APPEARANCE); setSuccess('') }} type="button">Use defaults</button>
            </div>
          </div>
        </form>
        <div className="appearance-preview mt-4" style={{ '--preview-primary': form.primaryColor, '--preview-background': form.backgroundColor }}>
          <span className="badge">Preview</span>
          <h3 className="h5 mt-3 mb-1">A consistent look across the platform</h3>
          <p className="mb-3">The primary color updates links, buttons, and highlights.</p>
          <button className="btn btn-primary btn-sm" type="button">Example action</button>
        </div>
      </div>
    </section>
  )
}

function MaintenanceSettings({ maintenance, maintenanceError, updateMaintenance }) {
  const [enabled, setEnabled] = useState(maintenance.enabled)
  const [message, setMessage] = useState(maintenance.message || DEFAULT_MAINTENANCE_MESSAGE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function saveMaintenance(event) {
    event.preventDefault()
    if (enabled && !maintenance.enabled
      && !window.confirm('Enable maintenance mode? Non-admin access will be blocked until it is turned off.')) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateMaintenance({ enabled, message })
      setSuccess(enabled ? 'Maintenance mode is on. Non-admin users will see the maintenance message.' : 'Maintenance mode is off.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to update maintenance mode.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card maintenance-settings-card mb-4" aria-labelledby="maintenance-heading">
      <div className="card-body">
        <div className="mb-4">
          <h2 className="h5 mb-1" id="maintenance-heading">Maintenance mode</h2>
          <p className="text-secondary mb-0">Turn off access for non-admin users during scheduled maintenance. Admin access stays available.</p>
        </div>
        {maintenanceError && <div className="alert alert-warning" role="status">{maintenanceError}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        <form onSubmit={saveMaintenance}>
          <div className="form-check form-switch mb-3">
            <input
              checked={enabled}
              className="form-check-input"
              id="maintenance-enabled"
              onChange={(event) => { setEnabled(event.target.checked); setSuccess(''); setError('') }}
              type="checkbox"
            />
            <label className="form-check-label fw-semibold" htmlFor="maintenance-enabled">
              {enabled ? 'Maintenance mode is on' : 'Maintenance mode is off'}
            </label>
          </div>
          <label className="form-label fw-semibold" htmlFor="maintenance-message">Message shown to users</label>
          <textarea
            className="form-control mb-3"
            id="maintenance-message"
            maxLength="500"
            onChange={(event) => { setMessage(event.target.value); setSuccess(''); setError('') }}
            required
            rows="3"
            value={message}
          />
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? 'Saving…' : enabled && !maintenance.enabled ? 'Enable maintenance mode'
              : !enabled && maintenance.enabled ? 'Disable maintenance mode' : 'Save maintenance settings'}
          </button>
        </form>
      </div>
    </section>
  )
}

function SystemSettings() {
  const {
    appearance,
    appearanceError,
    updateAppearance,
    maintenance,
    maintenanceLoading,
    maintenanceError,
    updateMaintenance,
  } = useTheme()

  return (
    <section className="system-settings-page">
      <div className="mb-4">
        <h1 className="h3 mb-1">System settings</h1>
        <p className="text-secondary mb-0">Manage the platform appearance and other system values.</p>
      </div>
      <AppearanceSettings
        key={`${appearance.primaryColor}-${appearance.backgroundColor}`}
        appearance={appearance}
        appearanceError={appearanceError}
        updateAppearance={updateAppearance}
      />
      {maintenanceLoading ? (
        <div className="card card-body mb-4 text-secondary" role="status">Loading maintenance settings…</div>
      ) : (
        <MaintenanceSettings
          maintenance={maintenance}
          maintenanceError={maintenanceError}
          updateMaintenance={updateMaintenance}
        />
      )}
      <AdminResourcePage
        columns={columns}
        createLabel="Add setting"
        description="Manage additional platform-wide values exposed to administrators."
        fields={fields}
        resource="settings"
        title="Additional settings"
      />
    </section>
  )
}

export default SystemSettings
