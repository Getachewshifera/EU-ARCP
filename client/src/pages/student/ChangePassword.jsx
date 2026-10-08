import React, { useRef, useState } from 'react'
import studentService from '../../services/studentService.js'
import { getErrorMessage } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, Notice } from '../../components/portal/student/StudentUi.jsx'

const initialForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function ChangePassword() {
  const formRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and confirmation do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.')
      return
    }
    setSaving(true)
    try {
      await studentService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm(initialForm)
      setNotice('Your password has been changed.')
      formRef.current?.reset()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="Change password" description="Choose a strong password to protect your account." />
      {error && <Notice variant="danger">{error}</Notice>}
      <Notice>{notice}</Notice>
      <form ref={formRef} className="card shadow-sm" onSubmit={submit}>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="current-password" className="form-label">Current password</label>
            <input className="form-control" id="current-password" name="currentPassword" type="password" autoComplete="current-password" required
              value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="new-password" className="form-label">New password</label>
            <input className="form-control" id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength="8" required
              value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
            <div className="form-text">Use at least 8 characters.</div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="form-label">Confirm new password</label>
            <input className="form-control" id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required
              value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          </div>
        </div>
        <div className="card-footer bg-body d-flex justify-content-end">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
        </div>
      </form>
    </main>
  )
}
