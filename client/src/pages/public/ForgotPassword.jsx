// Purpose: Starts the password recovery process.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await authService.forgotPassword({ email })
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=password-reset`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to start password recovery.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="We’ll send a verification code to your account email." title="Reset your password">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form className="vstack gap-3" onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor="forgot-email">Email address</label>
          <input autoComplete="email" className="form-control" id="forgot-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </div>
        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? 'Sending code…' : 'Send verification code'}
        </button>
      </form>
    </AuthPage>
  )
}

export default ForgotPassword
