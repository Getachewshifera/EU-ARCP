import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { errorMessage, PageHeader } from '../../components/portal/lecturer/LecturerUI.jsx'

function UploadMaterial() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => payload.append(key, value))
      if (file) payload.append('file', file)
      const response = await lecturerService.uploadMaterial(payload)
      const result = response?.data?.data ?? response?.data ?? response
      const id = result?.id ?? result?._id ?? result?.material?.id ?? result?.material?._id
      navigate(id != null ? `/lecturer/materials/${id}` : '/lecturer/my-materials', { replace: true })
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to upload the material.')) }
    finally { setSaving(false) }
  }

  return (
    <section>
      <PageHeader title="Upload material" description="Share a learning resource with your academic community." />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label" htmlFor="material-title">Title</label><input className="form-control" id="material-title" required maxLength="200" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="material-category">Category or subject</label><input className="form-control" id="material-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
            <div className="col-12"><label className="form-label" htmlFor="material-description">Description</label><textarea className="form-control" id="material-description" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <div className="col-12"><label className="form-label" htmlFor="material-file">Resource file</label><input className="form-control" id="material-file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><div className="form-text">Choose a file to attach to this material.</div></div>
          </div>
        </div>
        <div className="card-footer bg-white d-flex flex-wrap justify-content-end gap-2"><Link className="btn btn-outline-secondary" to="/lecturer/my-materials">Cancel</Link><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Submit material'}</button></div>
      </form>
    </section>
  )
}

export default UploadMaterial
