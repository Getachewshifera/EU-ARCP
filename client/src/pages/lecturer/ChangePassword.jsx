import { useState } from 'react'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage } from '../../components/portal/lecturer/lecturerUtils.js'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { getPasswordPolicyError, PASSWORD_HINT, PASSWORD_PATTERN } from '../../utils/passwordPolicy.js'

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('')
    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and confirmation do not match.')
      return
    }
    const passwordError = getPasswordPolicyError(form.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setSaving(true)
    try {
      await lecturerService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setNotice('Your password has been changed.')
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to change your password.')) }
    finally { setSaving(false) }
  }

  return (
    <section>
      <PageHeader title="Change password" description="Use a strong password that you do not use elsewhere." />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <PasswordInput
              autoComplete="current-password"
              className="col-md-8"
              id="current-password"
              label="Current password"
              name="currentPassword"
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              required
              value={form.currentPassword}
            />
            <PasswordInput
              autoComplete="new-password"
              className="col-md-8"
              hint={PASSWORD_HINT}
              id="new-password"
              label="New password"
              minLength={8}
              maxLength={200}
              name="newPassword"
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              pattern={PASSWORD_PATTERN}
              required
              value={form.newPassword}
              title={PASSWORD_HINT}
            />
            <PasswordInput
              autoComplete="new-password"
              className="col-md-8"
              id="confirm-password"
              label="Confirm new password"
              minLength={8}
              maxLength={200}
              name="confirmPassword"
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              pattern={PASSWORD_PATTERN}
              required
              value={form.confirmPassword}
              title={PASSWORD_HINT}
            />
          </div>
        </div>
        <div className="card-footer bg-body"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></div>
      </form>
    </section>
  )
}

export default ChangePassword
