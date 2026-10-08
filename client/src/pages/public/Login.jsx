// Purpose: Public login page.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import useAuth from '../../hooks/useAuth.js'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = await login(form)
      const role = String(user.role || '').toLowerCase()
      const destination = location.state?.from?.pathname
      navigate(destination || `/${['admin', 'lecturer', 'student'].includes(role) ? role : 'student'}`, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="Sign in to continue to your academic workspace." title="Welcome back">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form className="vstack gap-3" onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor="login-email">Email address</label>
          <input autoComplete="email" className="form-control" id="login-email" name="email" onChange={update} required type="email" value={form.email} />
        </div>
        <div>
          <label className="form-label" htmlFor="login-password">Password</label>
          <input autoComplete="current-password" className="form-control" id="login-password" name="password" onChange={update} required type="password" value={form.password} />
        </div>
        <div className="text-end"><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="btn btn-primary btn-lg" disabled={submitting} type="submit">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-secondary text-center mt-4 mb-0">
        New to EU-ARCP? <Link to="/register">Create an account</Link>
      </p>
    </AuthPage>
  )
}

export default Login
