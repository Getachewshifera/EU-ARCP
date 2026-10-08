// Purpose: Public account registration page.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import authService from '../../services/authService.js'

const initialForm = {
  role: 'student',
  firstName: '',
  lastName: '',
  email: '',
  university: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)

    const { role } = form
    const details = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      university: form.university,
      password: form.password,
    }
    try {
      const register = role === 'lecturer' ? authService.registerLecturer : authService.registerStudent
      const response = await register(details)
      const payload = response.data?.data ?? response.data ?? {}
      const email = payload.email || details.email
      if (payload.requiresVerification || payload.otpSent) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=registration`)
      } else if (role === 'student' && payload.status === 'pending') {
        navigate(`/registration-status?email=${encodeURIComponent(email)}`)
      } else {
        setNotice(payload.message || 'Registration submitted successfully. You can sign in after your account is approved.')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to submit registration.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="Create an account to collaborate with your academic community." title="Create your account">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <form className="vstack gap-3" onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor="register-role">Account type</label>
          <select className="form-select" id="register-role" name="role" onChange={update} value={form.role}>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
          </select>
        </div>
        <div className="row g-3">
          {['firstName', 'lastName'].map((name) => (
            <div className="col-sm-6" key={name}>
              <label className="form-label" htmlFor={`register-${name}`}>{name === 'firstName' ? 'First name' : 'Last name'}</label>
              <input autoComplete={name === 'firstName' ? 'given-name' : 'family-name'} className="form-control" id={`register-${name}`} name={name} onChange={update} required value={form[name]} />
            </div>
          ))}
        </div>
        <div>
          <label className="form-label" htmlFor="register-email">Email address</label>
          <input autoComplete="email" className="form-control" id="register-email" name="email" onChange={update} required type="email" value={form.email} />
        </div>
        <div>
          <label className="form-label" htmlFor="register-university">University</label>
          <input className="form-control" id="register-university" name="university" onChange={update} required value={form.university} />
        </div>
        <div>
          <label className="form-label" htmlFor="register-password">Password</label>
          <input autoComplete="new-password" className="form-control" id="register-password" minLength="8" name="password" onChange={update} required type="password" value={form.password} />
        </div>
        <div>
          <label className="form-label" htmlFor="register-confirm-password">Confirm password</label>
          <input autoComplete="new-password" className="form-control" id="register-confirm-password" minLength="8" name="confirmPassword" onChange={update} required type="password" value={form.confirmPassword} />
        </div>
        <button className="btn btn-primary btn-lg" disabled={submitting} type="submit">
          {submitting ? 'Submitting…' : 'Create account'}
        </button>
      </form>
      <p className="text-secondary text-center mt-4 mb-0">Already registered? <Link to="/login">Sign in</Link></p>
    </AuthPage>
  )
}

export default Register
