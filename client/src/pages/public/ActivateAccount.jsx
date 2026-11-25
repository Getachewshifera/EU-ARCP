// Purpose: Shows the activation page for new users to set a permanent password.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { getPasswordPolicyError, PASSWORD_HINT, PASSWORD_PATTERN } from '../../utils/passwordPolicy.js'
import useLanguage from '../../hooks/useLanguage.js'


function formatCountdown(totalMs) {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return '00:00'
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function ActivateAccount() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const registrationData = location.state || {}
  const expiryTime = registrationData.expiresAt || registrationData.activationExpiresAt

  const [form, setForm] = useState({
    username: registrationData.username || '',
    email: registrationData.email || '',
    temporaryPassword: registrationData.temporaryPassword || '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const notice = registrationData.emailDeliveryFailed
    ? 'Email delivery is unavailable, but your activation details are shown below.'
    : 'Use the temporary credentials shown below to complete account activation.'
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [remainingMs, setRemainingMs] = useState(5 * 60 * 1000)

  useEffect(() => {
    const expiresAt = expiryTime ? new Date(expiryTime).getTime() : Date.now() + 5 * 60 * 1000
    const updateRemaining = () => setRemainingMs(Math.max(0, expiresAt - Date.now()))
    const initialTimerId = setTimeout(updateRemaining, 0)
    const intervalId = setInterval(updateRemaining, 1000)
    return () => {
      clearTimeout(initialTimerId)
      clearInterval(intervalId)
    }
  }, [expiryTime])

  const expired = remainingMs <= 0

  async function copyToClipboard(value, label) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      window.setTimeout(() => setCopiedField(''), 1500)
    } catch {
      setError(t('Unable to copy to clipboard. Please copy the value manually.'))
    }
  }

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (expired) {
      setError(t('The activation window has expired. Please contact support or re-register.'))
      return
    }
    if (!form.username || !form.email || !form.temporaryPassword) {
      setError(t('Activation details are missing. Please go back and try again.'))
      return
    }
    const passwordError = getPasswordPolicyError(form.newPassword)
    if (passwordError) {
      setError(t(passwordError))
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t('The new password and confirmation do not match.'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await authService.activateAccount({
        username: form.username,
        email: form.email,
        currentPassword: form.temporaryPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })
      navigate('/login', { state: { message: t('Account activated successfully. Please sign in using your username and new password.') }, replace: true })
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to activate your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="Set a permanent password before your activation deadline expires." title="Activate your account">
      {notice &&       <div className="alert alert-info" role="status">{t(notice)}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="alert alert-light border mb-4" role="status">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <strong>{t('Activation expires in')}</strong>
          <span className="badge bg-warning text-dark fs-6 px-3 py-2">{formatCountdown(remainingMs)}</span>
        </div>
      </div>

      <div className="vstack gap-3 mb-4">
        <div>
          <label className="form-label" htmlFor="activation-username">{t('Username')}</label>
          <div className="input-group">
            <input className="form-control" id="activation-username" readOnly value={form.username} />
            <button className="btn btn-outline-secondary" onClick={() => copyToClipboard(form.username, 'username')} type="button">{t(copiedField === 'username' ? 'Copied' : 'Copy')}</button>
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="activation-password">{t('Temporary password')}</label>
          <div className="input-group">
            <input className="form-control" id="activation-password" readOnly type={showPassword ? 'text' : 'password'} value={form.temporaryPassword} />
            <button className="btn btn-outline-secondary" onClick={() => setShowPassword((current) => !current)} type="button">{t(showPassword ? 'Hide' : 'Show')}</button>
            <button className="btn btn-outline-secondary" onClick={() => copyToClipboard(form.temporaryPassword, 'password')} type="button">{t(copiedField === 'password' ? 'Copied' : 'Copy')}</button>
          </div>
        </div>
      </div>

      <form className="vstack gap-3" onSubmit={submit}>
        <PasswordInput
          autoComplete="new-password"
          disabled={submitting || expired}
          id="new-password"
          label="New password"
          minLength={8}
          maxLength={200}
          name="newPassword"
          onChange={update}
          pattern={PASSWORD_PATTERN}
          required
          value={form.newPassword}
          hint={PASSWORD_HINT}
          title={PASSWORD_HINT}
        />
        <PasswordInput
          autoComplete="new-password"
          disabled={submitting || expired}
          id="confirm-password"
          label="Confirm new password"
          minLength={8}
          maxLength={200}
          name="confirmPassword"
          onChange={update}
          pattern={PASSWORD_PATTERN}
          required
          value={form.confirmPassword}
          title={PASSWORD_HINT}
        />

        <button className="btn btn-primary btn-lg" disabled={submitting || expired} type="submit">
          {t(submitting ? 'Activating…' : expired ? 'Activation expired' : 'Activate account')}
        </button>
      </form>
    </AuthPage>
  )
}

export default ActivateAccount
