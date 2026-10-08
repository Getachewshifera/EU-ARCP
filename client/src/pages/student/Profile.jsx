import React, { useCallback, useEffect, useState } from 'react'
import studentService from '../../services/studentService.js'
import { asEntity, getErrorMessage } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, Notice } from '../../components/portal/student/StudentUi.jsx'

const fields = [
  ['firstName', 'First name', 'text'], ['lastName', 'Last name', 'text'],
  ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel'],
  ['studentId', 'Student ID', 'text'], ['university', 'University', 'text'],
  ['department', 'Department', 'text'],
]

function profileFrom(response) {
  const result = asEntity(response, ['profile', 'student', 'user'])
  return result.profile || result.student || result.user || result
}

export default function Profile() {
  const [profile, setProfile] = useState({})
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      const result = profileFrom(await studentService.getProfile())
      setProfile(result)
      setForm(Object.fromEntries([...fields.map(([name]) => [name, result?.[name] ?? '']), ['bio', result?.bio ?? '']]))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(loadProfile, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])
  const retryProfile = () => {
    setLoading(true)
    loadProfile()
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await studentService.updateProfile(form)
      const result = profileFrom(response)
      setProfile(result)
      setForm((current) => ({ ...current, ...Object.fromEntries([...fields.map(([name]) => [name, result?.[name] ?? current[name]]), ['bio', result?.bio ?? current.bio]]) }))
      setNotice('Your profile has been updated.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="My profile" description="Review and update your student contact and academic details." />
      {loading ? <LoadingState label="Loading profile…" /> : (
        <>
          {error && <ErrorState message={error} onRetry={retryProfile} />}
          <Notice>{notice}</Notice>
          <form className="card shadow-sm" onSubmit={submit}>
            <div className="card-body">
              <div className="row g-3">
                {fields.map(([name, label, type]) => (
                  <div className="col-12 col-md-6" key={name}>
                    <label className="form-label" htmlFor={`profile-${name}`}>{label}</label>
                    <input id={`profile-${name}`} className="form-control" type={type} name={name} autoComplete={name === 'email' ? 'email' : undefined}
                      value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
                  </div>
                ))}
                <div className="col-12">
                  <label className="form-label" htmlFor="profile-bio">About me</label>
                  <textarea id="profile-bio" className="form-control" name="bio" rows="4" value={form.bio ?? ''}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })} />
                </div>
              </div>
            </div>
            <div className="card-footer bg-body d-flex justify-content-end">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
          {profile && Object.keys(profile).length === 0 && <p className="small text-body-secondary mt-3 mb-0">No profile details were returned. You can add your information above.</p>}
        </>
      )}
    </main>
  )
}
