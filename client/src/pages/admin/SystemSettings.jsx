import { useEffect, useState } from 'react'
import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import adminService from '../../services/adminService.js'
import userService from '../../services/userService.js'
import { getPasswordPolicyError, PASSWORD_HINT, PASSWORD_PATTERN } from '../../utils/passwordPolicy.js'
import useTheme from '../../hooks/useTheme.js'
import useLanguage from '../../hooks/useLanguage.js'

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
  const { t } = useLanguage()
  const [form, setForm] = useState(() => ({
    primaryColor: appearance.primaryColor || DEFAULT_APPEARANCE.primaryColor,
    backgroundColor: appearance.backgroundColor || DEFAULT_APPEARANCE.backgroundColor,
  }))
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
      await updateAppearance({
        primaryColor: form.primaryColor,
        backgroundColor: form.backgroundColor,
      })
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
          <h2 className="h5 mb-1" id="appearance-heading">{t('Site appearance')}</h2>
          <p className="text-secondary mb-0">{t('These colors apply globally. The background color is used in light mode.')}</p>
        </div>
        {appearanceError && <div className="alert alert-warning" role="status">{appearanceError}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        <form onSubmit={saveAppearance}>
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-lg-4">
              <label className="form-label fw-semibold" htmlFor="site-primary-color">{t('Primary system color')}</label>
              <div className="input-group">
                <input aria-label="Primary system color" className="form-control form-control-color" id="site-primary-color" name="primaryColor" onChange={updateField} type="color" value={form.primaryColor} />
                <span className="input-group-text">{form.primaryColor}</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-4">
              <label className="form-label fw-semibold" htmlFor="site-background-color">{t('Light background color')}</label>
              <div className="input-group">
                <input aria-label="Light background color" className="form-control form-control-color" id="site-background-color" name="backgroundColor" onChange={updateField} type="color" value={form.backgroundColor} />
                <span className="input-group-text">{form.backgroundColor}</span>
              </div>
            </div>
            <div className="col-lg-4 d-flex gap-2">
              <button className="btn btn-primary" disabled={saving} type="submit">{t(saving ? 'Saving…' : 'Save appearance')}</button>
              <button className="btn btn-outline-secondary" onClick={() => { setForm(DEFAULT_APPEARANCE); setSuccess('') }} type="button">{t('Use defaults')}</button>
            </div>
          </div>
        </form>
        <div className="appearance-preview mt-4" style={{ '--preview-primary': form.primaryColor, '--preview-background': form.backgroundColor }}>
          <span className="badge">{t('Preview')}</span>
          <h3 className="h5 mt-3 mb-1">{t('A consistent look across the platform')}</h3>
          <p className="mb-3">{t('The primary color updates links, buttons, and highlights.')}</p>
          <button className="btn btn-primary btn-sm" type="button">Example action</button>
        </div>
      </div>
    </section>
  )
}

function MaintenanceSettings({ maintenance, maintenanceError, updateMaintenance }) {
  const { t } = useLanguage()
  const [enabled, setEnabled] = useState(maintenance.enabled)
  const [message, setMessage] = useState(maintenance.message || DEFAULT_MAINTENANCE_MESSAGE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function saveMaintenance(event) {
    event.preventDefault()
    if (enabled && !maintenance.enabled
      && !window.confirm(t('Enable maintenance mode? Non-admin access will be blocked until it is turned off.'))) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateMaintenance({ enabled, message })
      setSuccess(t(enabled ? 'Maintenance mode is on. Non-admin users will see the maintenance message.' : 'Maintenance mode is off.'))
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
          <h2 className="h5 mb-1" id="maintenance-heading">{t('Maintenance mode')}</h2>
          <p className="text-secondary mb-0">{t('Turn off access for non-admin users during scheduled maintenance. Admin access stays available.')}</p>
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
              {t(enabled ? 'Maintenance mode is on' : 'Maintenance mode is off')}
            </label>
          </div>
          <label className="form-label fw-semibold" htmlFor="maintenance-message">{t('Message shown to users')}</label>
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
            {t(saving ? 'Saving…' : enabled && !maintenance.enabled ? 'Enable maintenance mode'
              : !enabled && maintenance.enabled ? 'Disable maintenance mode' : 'Save maintenance settings')}
          </button>
        </form>
      </div>
    </section>
  )
}

function AccountSecuritySettings() {
  const { t } = useLanguage()
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [username, setUsername] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetNotice, setResetNotice] = useState('')

  async function changeOwnPassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('The new password and confirmation do not match.'))
      return
    }
    const policyError = getPasswordPolicyError(passwordForm.newPassword)
    if (policyError) {
      setPasswordError(t(policyError))
      return
    }

    setPasswordSaving(true)
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordNotice(t('Your password has been changed.'))
    } catch (requestError) {
      setPasswordError(t(requestError.response?.data?.message || requestError.message || 'Unable to change your password.'))
    } finally {
      setPasswordSaving(false)
    }
  }

  async function sendUserReset(event) {
    event.preventDefault()
    setResetError('')
    setResetNotice('')
    setResetSending(true)
    try {
      const response = await adminService.requestUserPasswordReset(username.trim())
      setResetNotice(t(response.data?.message || 'Password reset instructions were sent to the user’s registered email.'))
      setUsername('')
    } catch (requestError) {
      setResetError(t(requestError.response?.data?.message || requestError.message || 'Unable to send password reset instructions.'))
    } finally {
      setResetSending(false)
    }
  }

  return (
    <div className="row g-4 mb-4">
      <div className="col-lg-6">
        <section className="card h-100" aria-labelledby="admin-password-heading">
          <div className="card-body">
            <h2 className="h5 mb-1" id="admin-password-heading">{t('Change your password')}</h2>
            <p className="text-secondary">{t('Verify your current password before choosing a new one.')}</p>
            {passwordError && <div className="alert alert-danger" role="alert">{passwordError}</div>}
            {passwordNotice && <div className="alert alert-success" role="status">{passwordNotice}</div>}
            <form className="vstack gap-3" onSubmit={changeOwnPassword}>
              <PasswordInput
                autoComplete="current-password"
                id="settings-current-password"
                label={t('Current password')}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                required
                value={passwordForm.currentPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                hint={PASSWORD_HINT}
                id="settings-new-password"
                label={t('New password')}
                maxLength={200}
                minLength={8}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                pattern={PASSWORD_PATTERN}
                required
                title={PASSWORD_HINT}
                value={passwordForm.newPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                id="settings-confirm-password"
                label={t('Confirm new password')}
                maxLength={200}
                minLength={8}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                pattern={PASSWORD_PATTERN}
                required
                title={PASSWORD_HINT}
                value={passwordForm.confirmPassword}
              />
              <div>
                <button className="btn btn-primary" disabled={passwordSaving} type="submit">
                  {t(passwordSaving ? 'Updating…' : 'Update password')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
      <div className="col-lg-6">
        <section className="card h-100" aria-labelledby="user-password-reset-heading">
          <div className="card-body">
            <h2 className="h5 mb-1" id="user-password-reset-heading">{t('Reset a user password')}</h2>
            <p className="text-secondary">{t('Enter a username to send password-reset instructions to that user’s registered email. The user completes the reset with their verification code.')}</p>
            {resetError && <div className="alert alert-danger" role="alert">{resetError}</div>}
            {resetNotice && <div className="alert alert-success" role="status">{resetNotice}</div>}
            <form className="vstack gap-3" onSubmit={sendUserReset}>
              <div>
                <label className="form-label" htmlFor="reset-user-username">{t('Username')}</label>
                <input
                  autoComplete="off"
                  className="form-control"
                  id="reset-user-username"
                  maxLength="60"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
              </div>
              <div>
                <button className="btn btn-outline-primary" disabled={resetSending} type="submit">
                  {t(resetSending ? 'Sending…' : 'Send reset instructions')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

function ChatAvailabilitySettings() {
  const { t } = useLanguage()
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    adminService.getChatSettings()
      .then((response) => {
        if (active) setEnabled(response.data?.enabled !== false)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || t('Unable to load chat settings.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [t])

  async function update(event) {
    const nextEnabled = event.target.checked
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await adminService.updateChatSettings(nextEnabled)
      setEnabled(response.data?.enabled === true)
      setNotice(t(nextEnabled ? 'Chat is enabled for all users.' : 'Chat is disabled for all users.'))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update chat settings.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card mb-4" aria-labelledby="chat-availability-heading">
      <div className="card-body">
        <h2 className="h5 mb-1" id="chat-availability-heading">{t('Chat availability')}</h2>
        <p className="text-secondary">{t('Disable group and private chat platform-wide when needed.')}</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}
        <div className="form-check form-switch">
          <input
            checked={enabled}
            className="form-check-input"
            disabled={loading || saving || Boolean(error && loading)}
            id="chat-enabled"
            onChange={update}
            type="checkbox"
          />
          <label className="form-check-label fw-semibold" htmlFor="chat-enabled">
            {t(loading ? 'Loading chat settings…' : enabled ? 'Chat is enabled' : 'Chat is disabled')}
          </label>
        </div>
      </div>
    </section>
  )
}

function SystemSettings() {
  const { t } = useLanguage()
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
        <h1 className="h3 mb-1">{t('System settings')}</h1>
        <p className="text-secondary mb-0">{t('Manage the platform appearance and other system values.')}</p>
      </div>
      <AppearanceSettings
        key={`${appearance.primaryColor}-${appearance.backgroundColor}`}
        appearance={appearance}
        appearanceError={appearanceError}
        updateAppearance={updateAppearance}
      />
      {maintenanceLoading ? (
        <div className="card card-body mb-4 text-secondary" role="status">{t('Loading maintenance settings…')}</div>
      ) : (
        <MaintenanceSettings
          maintenance={maintenance}
          maintenanceError={maintenanceError}
          updateMaintenance={updateMaintenance}
        />
      )}
      <ChatAvailabilitySettings />
      <AccountSecuritySettings />
      <AdminResourcePage
        columns={columns}
        createLabel="Add setting"
        description={t('Manage additional platform-wide values exposed to administrators.')}
        fields={fields}
        resource="settings"
        title="Additional settings"
      />
    </section>
  )
}

export default SystemSettings
