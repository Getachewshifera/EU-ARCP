// Purpose: Sets a replacement password after verification.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { getPasswordPolicyError, PASSWORD_HINT, PASSWORD_PATTERN } from '../../utils/passwordPolicy.js'


function ResetPassword() {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const resetToken = searchParams.get('token') || ''
  const [form, setForm] = useState({ email: initialEmail, password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    const passwordError = getPasswordPolicyError(form.password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setSubmitting(true)
    try {
      await authService.resetPassword({
        email: form.email,
        resetToken,
        password: form.password,
      })
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="Choose a new password for your account." title="Create a new password">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success ? (
        <div className="alert alert-success" role="status">
          Your password has been updated. <Link to="/login">Sign in</Link>.
        </div>
      ) : (
        <form className="vstack gap-3" onSubmit={submit}>
          <div>
            <label className="form-label" htmlFor="reset-email">Email address</label>
            <input autoComplete="email" className="form-control" id="reset-email" name="email" onChange={update} required type="email" value={form.email} />
          </div>
          <PasswordInput
            autoComplete="new-password"
            id="reset-password"
            label="New password"
            minLength={8}
            maxLength={200}
            name="password"
            onChange={update}
            pattern={PASSWORD_PATTERN}
            required
            value={form.password}
            hint={PASSWORD_HINT}
            title={PASSWORD_HINT}
          />
          <PasswordInput
            autoComplete="new-password"
            id="reset-confirm-password"
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
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthPage>
  )
}

export default ResetPassword
