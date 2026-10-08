// Purpose: Page showing the status of a registration request.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'

function RegistrationStatus() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function checkStatus(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await authService.registrationStatus({ email })
      setResult(response.data?.data ?? response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to check registration status.')
    } finally {
      setLoading(false)
    }
  }

  const status = String(result?.status || '').toLowerCase()
  const statusClass = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'

  return (
    <AuthPage description="Check the review progress of your account request." title="Registration status">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form className="vstack gap-3 mb-4" onSubmit={checkStatus}>
        <div>
          <label className="form-label" htmlFor="status-email">Email address</label>
          <input autoComplete="email" className="form-control" id="status-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </div>
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Checking…' : 'Check status'}
        </button>
      </form>
      {result && (
        <div className={`alert alert-${statusClass}`} role="status">
          <strong className="text-capitalize">{result.status || 'Status available'}</strong>
          {result.message && <p className="mb-0 mt-1">{result.message}</p>}
        </div>
      )}
      <p className="text-secondary mb-0">Need an account? <Link to="/register">Submit a registration request</Link>.</p>
    </AuthPage>
  )
}

export default RegistrationStatus
