import { useCallback, useEffect, useRef, useState } from 'react'
import userService from '../../services/userService.js'
import { getAvatarUrl } from '../../services/studentService.js'
import useLanguage from '../../hooks/useLanguage.js'

const editableFields = [
  ['firstName', 'First name', 'text', 80],
  ['middleName', 'Middle name', 'text', 80],
  ['lastName', 'Last name', 'text', 80],
  ['email', 'Email address', 'email', 254],
  ['phone', 'Phone number', 'tel', 40],
  ['academicYear', 'Academic year', 'text', 50],
]

function entityId(value) {
  if (value && typeof value === 'object') return value._id || value.id || ''
  return typeof value === 'string' ? value : ''
}

function itemsFrom(response) {
  const body = response?.data?.data ?? response?.data ?? {}
  return Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : []
}

function profileFrom(response) {
  const body = response?.data?.data ?? response?.data ?? {}
  return body.user ?? body.profile ?? body
}

function initialForm(profile = {}) {
  return {
    firstName: profile.firstName ?? '',
    middleName: profile.middleName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
    academicYear: profile.academicYear ?? '',
    university: entityId(profile.university),
    college: entityId(profile.college),
    department: entityId(profile.department),
    program: entityId(profile.program),
  }
}

function AdminProfile() {
  const { t } = useLanguage()
  const photoInput = useRef(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(initialForm())
  const [universities, setUniversities] = useState([])
  const [colleges, setColleges] = useState([])
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      const [profileResponse, universityResponse] = await Promise.all([
        userService.getCurrentUser(),
        userService.listUniversities(),
      ])
      const account = profileFrom(profileResponse)
      const nextForm = initialForm(account)
      const options = itemsFrom(universityResponse)
      const [collegeOptions, departmentOptions, programOptions] = await Promise.all([
        nextForm.university ? userService.listColleges(nextForm.university).then(itemsFrom) : [],
        nextForm.college ? userService.listDepartments(nextForm.college).then(itemsFrom) : [],
        nextForm.department ? userService.listPrograms(nextForm.department).then(itemsFrom) : [],
      ])
      setProfile(account)
      setForm(nextForm)
      setUniversities(options)
      setColleges(collegeOptions)
      setDepartments(departmentOptions)
      setPrograms(programOptions)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load your profile.'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProfile() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  async function updateAcademicField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'university' ? { college: '', department: '', program: '' } : {}),
      ...(field === 'college' ? { department: '', program: '' } : {}),
      ...(field === 'department' ? { program: '' } : {}),
    }))
    setError('')
    try {
      if (field === 'university') {
        setColleges(value ? itemsFrom(await userService.listColleges(value)) : [])
        setDepartments([])
        setPrograms([])
      } else if (field === 'college') {
        setDepartments(value ? itemsFrom(await userService.listDepartments(value)) : [])
        setPrograms([])
      } else if (field === 'department') {
        setPrograms(value ? itemsFrom(await userService.listPrograms(value)) : [])
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load the academic options.'))
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const response = await userService.updateProfile(form)
      const updated = profileFrom(response)
      setProfile(updated)
      setForm(initialForm(updated))
      setNotice(t('Your profile has been updated.'))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const data = new FormData()
    data.append('photo', file)
    setError('')
    setNotice('')
    setUploading(true)
    try {
      const updated = profileFrom(await userService.uploadPhoto(data))
      setProfile(updated)
      setNotice(t('Profile photo updated.'))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Could not upload photo. Use JPEG/PNG/WebP under 5 MB.'))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <section>
      <div className="mb-4">
        <h1 className="h3 mb-1">{t('My profile')}</h1>
        <p className="text-secondary mb-0">{t('View and update your account and contact information.')}</p>
      </div>
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
          <span>{error}</span>
          {!loading && !profile && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => { setLoading(true); void loadProfile() }} type="button">
              {t('Retry')}
            </button>
          )}
        </div>
      )}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {loading ? <div className="card card-body text-secondary" role="status">{t('Loading profile…')}</div> : profile && (
        <form className="card" onSubmit={saveProfile}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-3 mb-4">
              <img
                alt={t('Profile')}
                className="rounded-circle border"
                height="80"
                src={getAvatarUrl(profile.profilePhoto) || '/image.png'}
                style={{ objectFit: 'cover' }}
                width="80"
              />
              <div>
                <div className="fw-semibold">{profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ')}</div>
                <div className="text-secondary small">{t('Admin')} · {profile.username}</div>
                <button className="btn btn-outline-primary btn-sm mt-2" disabled={uploading} onClick={() => photoInput.current?.click()} type="button">
                  {t(uploading ? 'Uploading…' : 'Change photo')}
                </button>
                <input ref={photoInput} accept="image/jpeg,image/png,image/webp" className="d-none" onChange={uploadPhoto} type="file" />
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="admin-profile-username">{t('Username')}</label>
                <input className="form-control" id="admin-profile-username" readOnly value={profile.username || ''} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="admin-profile-role">{t('Role')}</label>
                <input className="form-control" id="admin-profile-role" readOnly value={t('Admin')} />
              </div>
              {editableFields.map(([name, label, type, maxLength]) => (
                <div className="col-md-6" key={name}>
                  <label className="form-label" htmlFor={`admin-profile-${name}`}>{t(label)}{['firstName', 'lastName', 'email'].includes(name) ? ' *' : ''}</label>
                  <input
                    className="form-control"
                    id={`admin-profile-${name}`}
                    maxLength={maxLength}
                    onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                    required={['firstName', 'lastName', 'email'].includes(name)}
                    type={type}
                    value={form[name]}
                  />
                </div>
              ))}
              {[
                ['university', 'University', universities, true],
                ['college', 'College', colleges, false],
                ['department', 'Department', departments, false],
                ['program', 'Program', programs, false],
              ].map(([name, label, options, required]) => (
                <div className="col-md-6" key={name}>
                  <label className="form-label" htmlFor={`admin-profile-${name}`}>{t(label)}{required ? ' *' : ''}</label>
                  <select
                    className="form-select"
                    disabled={name !== 'university' && !form[{ college: 'university', department: 'college', program: 'department' }[name]]}
                    id={`admin-profile-${name}`}
                    onChange={(event) => void updateAcademicField(name, event.target.value)}
                    required={required}
                    value={form[name]}
                  >
                    <option value="">{t('Select')} {t(label).toLowerCase()}</option>
                    {options.map((option) => <option key={option._id} value={option._id}>{option.name}</option>)}
                  </select>
                </div>
              ))}
              <div className="col-12">
                <label className="form-label" htmlFor="admin-profile-bio">{t('About me')}</label>
                <textarea
                  className="form-control"
                  id="admin-profile-bio"
                  maxLength="2000"
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  rows="4"
                  value={form.bio}
                />
              </div>
            </div>
          </div>
          <div className="card-footer bg-body d-flex justify-content-end">
            <button className="btn btn-primary" disabled={saving} type="submit">{t(saving ? 'Saving…' : 'Save changes')}</button>
          </div>
        </form>
      )}
    </section>
  )
}

export default AdminProfile
