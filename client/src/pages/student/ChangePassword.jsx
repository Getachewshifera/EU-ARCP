import React, { useRef, useState } from 'react'
import studentService from '../../services/studentService.js'
import { getErrorMessage } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, Notice } from '../../components/portal/student/StudentUi.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'


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
          <PasswordInput
            autoComplete="current-password"
            className="mb-3"
            id="current-password"
            label="Current password"
            name="currentPassword"
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            required
            value={form.currentPassword}
          />
          <PasswordInput
            autoComplete="new-password"
            className="mb-3"
            hint="Use at least 8 characters."
            id="new-password"
            label="New password"
            minLength={8}
            name="newPassword"
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
            value={form.newPassword}
          />
          <PasswordInput
            autoComplete="new-password"
            id="confirm-password"
            label="Confirm new password"
            minLength={8}
            name="confirmPassword"
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            required
            value={form.confirmPassword}
          />
        </div>
        <div className="card-footer bg-body d-flex justify-content-end">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
        </div>
      </form>
    </main>
  )
}
