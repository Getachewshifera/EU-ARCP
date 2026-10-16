import React, { useCallback, useEffect, useState } from 'react'
import studentService from '../../services/studentService.js'
import { asEntity, getErrorMessage } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, Notice } from '../../components/portal/student/StudentUi.jsx'

const fields = [
  ['firstName', 'First name', 'text'],
  ['middleName', 'Middle name', 'text'],
  ['lastName', 'Last name', 'text'],
  ['phone', 'Phone number', 'tel'],
]

const academicYearOptions = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Graduate', 'PhD']

function recordId(value) {
  if (value && typeof value === 'object') return value._id || value.id || ''
  return typeof value === 'string' ? value : ''
}

function responseItems(response) {
  const body = response?.data?.data ?? response?.data ?? {}
  return Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : []
}

function profileFrom(response) {
  const result = asEntity(response, ['profile', 'student', 'user'])
  return result.profile || result.student || result.user || result
}

function profileForm(value) {
  return Object.fromEntries([
    ...fields.map(([name]) => [name, value?.[name] ?? '']),
    ['email', value?.email ?? ''],
    ['universityId', recordId(value?.university)],
    ['collegeId', recordId(value?.college)],
    ['departmentId', recordId(value?.department)],
    ['programId', recordId(value?.program)],
    ['academicYear', value?.academicYear ?? ''],
    ['bio', value?.bio ?? ''],
  ])
}

export default function Profile() {
  const [profile, setProfile] = useState({})
  const [form, setForm] = useState({})
  const [universities, setUniversities] = useState([])
  const [colleges, setColleges] = useState([])
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      const [profileResponse, universitiesResponse] = await Promise.all([
        studentService.getProfile(),
        studentService.listUniversities(),
      ])
      const result = profileFrom(profileResponse)
      const initialForm = profileForm(result)
      const universityItems = responseItems(universitiesResponse)
      const [collegeItems, departmentItems, programItems] = await Promise.all([
        initialForm.universityId ? studentService.listColleges(initialForm.universityId).then(responseItems) : [],
        initialForm.collegeId ? studentService.listDepartments(initialForm.collegeId).then(responseItems) : [],
        initialForm.departmentId ? studentService.listPrograms(initialForm.departmentId).then(responseItems) : [],
      ])
      setProfile(result)
      setForm(initialForm)
      setUniversities(universityItems)
      setColleges(collegeItems)
      setDepartments(departmentItems)
      setPrograms(programItems)
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
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      setError('First name and last name are required.')
      return
    }
    if (form.firstName.trim().length > 80 || (form.middleName || '').trim().length > 80 || form.lastName.trim().length > 80) {
      setError('Names must be 80 characters or fewer.')
      return
    }
    if ([form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').length > 160) {
      setError('Your full name must be 160 characters or fewer.')
      return
    }
    if ((form.bio || '').length > 2000) {
      setError('About me must be 2000 characters or fewer.')
      return
    }
    if ((form.phone || '').length > 40) {
      setError('Phone number must be 40 characters or fewer.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError('Enter a valid email address.')
        setSaving(false)
        return
      }
      if (!form.universityId || !form.collegeId || !form.departmentId || !form.programId || !form.academicYear) {
        setError('Select your university, college, department, program, and academic year.')
        setSaving(false)
        return
      }
      const editable = {
        ...Object.fromEntries(fields.map(([name]) => [name, form[name] ?? ''])),
        email: form.email.trim(),
        university: form.universityId,
        college: form.collegeId,
        department: form.departmentId,
        program: form.programId,
        academicYear: form.academicYear,
        bio: form.bio ?? '',
      }
      const response = await studentService.updateProfile(editable)
      const result = profileFrom(response)
      setProfile(result)
      setForm(profileForm(result))
      setEditing(false)
      setNotice('Your profile has been updated.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  function cancelEditing() {
    setForm(profileForm(profile))
    setEditing(false)
    setError('')
    setNotice('')
  }

  async function updateAcademicField(name, value) {
    setError('')
    try {
      if (name === 'universityId') {
        setForm((current) => ({ ...current, universityId: value, collegeId: '', departmentId: '', programId: '' }))
        setColleges([])
        setDepartments([])
        setPrograms([])
        if (value) setColleges(responseItems(await studentService.listColleges(value)))
      } else if (name === 'collegeId') {
        setForm((current) => ({ ...current, collegeId: value, departmentId: '', programId: '' }))
        setDepartments([])
        setPrograms([])
        if (value) setDepartments(responseItems(await studentService.listDepartments(value)))
      } else if (name === 'departmentId') {
        setForm((current) => ({ ...current, departmentId: value, programId: '' }))
        setPrograms([])
        if (value) setPrograms(responseItems(await studentService.listPrograms(value)))
      } else {
        setForm((current) => ({ ...current, [name]: value }))
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load the academic options.'))
    }
  }

  return (
    <main className="container py-4">
      <PageHeader
        title="My profile"
        description="Review your academic details and manage your contact information."
        actions={!loading && !editing && (
          <button className="btn btn-primary" onClick={() => { setEditing(true); setNotice(''); setError('') }} type="button">
            Edit profile
          </button>
        )}
      />
      {loading ? <LoadingState label="Loading profile…" /> : (
        <>
          {error && <ErrorState message={error} onRetry={retryProfile} />}
          <Notice>{notice}</Notice>
          <form className="card shadow-sm" onSubmit={submit}>
            <div className="card-body">
              <div className="row g-3">
                {[
                  ['studentId', 'Student ID', profile.studentId],
                  ['username', 'Username', profile.username],
                ].map(([name, label, value]) => (
                  <div className="col-12 col-md-6" key={name}>
                    <label className="form-label" htmlFor={`profile-${name}`}>{label}</label>
                    <input id={`profile-${name}`} className="form-control" readOnly value={value || 'Not provided'} />
                  </div>
                ))}
                {[
                  ['universityId', 'University', universities],
                  ['collegeId', 'College', colleges],
                  ['departmentId', 'Department', departments],
                  ['programId', 'Program', programs],
                ].map(([name, label, items]) => (
                  <div className="col-12 col-md-6" key={name}>
                    <label className="form-label" htmlFor={`profile-${name}`}>{label}{editing ? ' *' : ''}</label>
                    <select
                      className="form-select"
                      disabled={!editing || saving || (name !== 'universityId' && !form[{ collegeId: 'universityId', departmentId: 'collegeId', programId: 'departmentId' }[name]])}
                      id={`profile-${name}`}
                      required={editing}
                      value={form[name] ?? ''}
                      onChange={(event) => updateAcademicField(name, event.target.value)}
                    >
                      <option value="">Select {label.toLowerCase()}</option>
                      {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                    </select>
                  </div>
                ))}
                {fields.map(([name, label, type]) => (
                  <div className="col-12 col-md-6" key={name}>
                    <label className="form-label" htmlFor={`profile-${name}`}>
                      {label}{editing && ['firstName', 'lastName'].includes(name) ? ' *' : ''}
                    </label>
                    <input id={`profile-${name}`} className="form-control" type={type} name={name}
                      required={editing && ['firstName', 'lastName'].includes(name)} maxLength={name === 'phone' ? 40 : 80} disabled={!editing || saving}
                      value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
                  </div>
                ))}
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="profile-email">Email address *</label>
                  <input id="profile-email" className="form-control" type="email" required maxLength="254" disabled={!editing || saving} value={form.email ?? ''}
                    onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="profile-academicYear">Academic year *</label>
                  <select id="profile-academicYear" className="form-select" required disabled={!editing || saving}
                    value={form.academicYear ?? ''} onChange={(event) => setForm({ ...form, academicYear: event.target.value })}>
                    <option value="">Select academic year</option>
                    {academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                    {form.academicYear && !academicYearOptions.includes(form.academicYear)
                      && <option value={form.academicYear}>{form.academicYear}</option>}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="profile-bio">About me</label>
                  <textarea id="profile-bio" className="form-control" name="bio" rows="4" maxLength="2000" disabled={!editing || saving} value={form.bio ?? ''}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })} />
                </div>
              </div>
            </div>
            {editing && <div className="card-footer bg-body d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={cancelEditing} disabled={saving} type="button">Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>}
          </form>
          {profile && Object.keys(profile).length === 0 && <p className="small text-body-secondary mt-3 mb-0">No profile details were returned. You can add your information above.</p>}
        </>
      )}
    </main>
  )
}
