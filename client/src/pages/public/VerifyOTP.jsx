// Purpose: Verifies a one-time code during account or password recovery.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'

function VerifyOTP() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const purpose = searchParams.get('purpose') || 'registration'
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await authService.verifyOtp({ email, otp, purpose })
      const payload = response.data?.data ?? response.data ?? {}
      if (purpose === 'password-reset') {
        const token = payload.resetToken ?? payload.token ?? ''
        navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
      } else {
        navigate(`/registration-status?email=${encodeURIComponent(email)}`)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to verify this code.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description={`Enter the code sent to ${email || 'your email address'}.`} title="Verify your email">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!email && <div className="alert alert-warning" role="alert">An email address is required. <Link to="/register">Start registration</Link>.</div>}
      <form className="vstack gap-3" onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor="verification-code">Verification code</label>
          <input autoComplete="one-time-code" className="form-control form-control-lg text-center" id="verification-code" inputMode="numeric" maxLength="8" onChange={(event) => setOtp(event.target.value.trim())} required value={otp} />
        </div>
        <button className="btn btn-primary" disabled={submitting || !email} type="submit">
          {submitting ? 'Verifying…' : 'Verify code'}
        </button>
      </form>
    </AuthPage>
  )
}

export default VerifyOTP
