import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asEntity, getErrorMessage, getRecordId } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, Notice } from '../../components/portal/student/StudentUi.jsx'

export default function UploadMaterial() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [form, setForm] = useState({ title: '', description: '', course: '', subject: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!file) {
      setError('Choose a file to upload.')
      return
    }
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('file', file)
    setSaving(true)
    try {
      const result = asEntity(await studentService.uploadMaterial(data), ['material', 'item'])
      const id = getRecordId(result)
      if (id) navigate(`/student/materials/${encodeURIComponent(id)}`)
      else {
        setNotice('Your material was submitted.')
        setForm({ title: '', description: '', course: '', subject: '' })
        setFile(null)
        formRef.current?.reset()
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="Upload a material" description="Share a course resource with other students."
        actions={<Link className="btn btn-outline-secondary" to="/student/my-materials">My materials</Link>} />
      {error && <Notice variant="danger">{error}</Notice>}
      <Notice>{notice}</Notice>
      <form ref={formRef} className="card shadow-sm" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="material-title" className="form-label">Title <span className="text-danger">*</span></label>
              <input id="material-title" name="title" className="form-control" required maxLength="180" value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="material-course" className="form-label">Course</label>
              <input id="material-course" name="course" className="form-control" value={form.course}
                onChange={(event) => setForm({ ...form, course: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="material-subject" className="form-label">Subject or topic</label>
              <input id="material-subject" name="subject" className="form-control" value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <div className="col-12">
              <label htmlFor="material-description" className="form-label">Description</label>
              <textarea id="material-description" name="description" className="form-control" rows="4" value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="col-12">
              <label htmlFor="material-file" className="form-label">File <span className="text-danger">*</span></label>
              <input id="material-file" name="file" className="form-control" type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} />
              <div className="form-text">Select the resource file you want to share.</div>
            </div>
          </div>
        </div>
        <div className="card-footer bg-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <Link to="/student/materials" className="link-secondary">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Submit material'}</button>
        </div>
      </form>
    </main>
  )
}
