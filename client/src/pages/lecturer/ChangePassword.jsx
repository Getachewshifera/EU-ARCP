import { useState } from 'react'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage } from '../../components/portal/lecturer/lecturerUtils.js'

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
            <div className="col-md-8"><label className="form-label" htmlFor="current-password">Current password</label><input className="form-control" id="current-password" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></div>
            <div className="col-md-8"><label className="form-label" htmlFor="new-password">New password</label><input className="form-control" id="new-password" type="password" autoComplete="new-password" minLength="8" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /><div className="form-text">Use at least 8 characters.</div></div>
            <div className="col-md-8"><label className="form-label" htmlFor="confirm-password">Confirm new password</label><input className="form-control" id="confirm-password" type="password" autoComplete="new-password" minLength="8" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></div>
          </div>
        </div>
        <div className="card-footer bg-white"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></div>
      </form>
    </section>
  )
}

export default ChangePassword
