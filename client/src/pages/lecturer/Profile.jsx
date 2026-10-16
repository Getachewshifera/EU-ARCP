import { useCallback, useEffect, useState } from 'react'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

const fields = [
  ['name', 'Full name', 'text'],
  ['email', 'Email address', 'email'],
  ['phone', 'Phone number', 'tel'],
  ['bio', 'About', 'textarea'],
]

function referenceName(value) {
  if (value && typeof value === 'object') return value.name || ''
  return typeof value === 'string' && !/^[a-f\d]{24}$/i.test(value) ? value : ''
}

function LecturerProfile() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const profile = unwrap(await lecturerService.getProfile())
      setForm(profile?.user ?? profile?.profile ?? profile ?? {})
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to load your profile.')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const editable = Object.fromEntries(fields.map(([name]) => [name, form[name] ?? '']))
      const updated = unwrap(await lecturerService.updateProfile(editable))
      if (updated && typeof updated === 'object') {
        const next = updated.user ?? updated.profile ?? updated
        setForm((current) => ({ ...current, ...next, department: current.department }))
      }
      setNotice('Your profile has been updated.')
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to update your profile.')) }
    finally { setSaving(false) }
  }

  return (
    <section>
      <PageHeader title="My profile" description="Review and update your lecturer contact information." />
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && <>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}
        <form className="card" onSubmit={submit}>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-university">University</label>
                <input className="form-control" id="profile-university" readOnly value={referenceName(form.university) || 'Not provided'} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-department">Department</label>
                <input className="form-control" id="profile-department" readOnly value={referenceName(form.department) || 'Not provided'} />
              </div>
              {fields.map(([name, label, type]) => <div className={type === 'textarea' ? 'col-12' : 'col-md-6'} key={name}>
                <label className="form-label" htmlFor={`profile-${name}`}>{label}</label>
                {type === 'textarea'
                  ? <textarea className="form-control" id={`profile-${name}`} rows="4" value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
                  : <input className="form-control" id={`profile-${name}`} type={type} value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />}
              </div>)}
            </div>
          </div>
          <div className="card-footer bg-white d-flex justify-content-end">
            <button className="btn btn-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </>}
    </section>
  )
}

export default LecturerProfile
