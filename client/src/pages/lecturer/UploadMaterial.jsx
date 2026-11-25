import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import materialService from '../../services/materialService.js'
import { PageHeader } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage } from '../../components/portal/lecturer/lecturerUtils.js'
import { documentAccept, validateDocumentFile } from '../../utils/documentFile.js'
import useLanguage from '../../hooks/useLanguage.js'

function UploadMaterial() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '' })
  const [categories, setCategories] = useState([])
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    materialService.listCategories()
      .then((response) => {
        const payload = response?.data?.data ?? response?.data
        const items = Array.isArray(payload) ? payload : payload?.items ?? payload?.results
        if (active && Array.isArray(items)) setCategories(items)
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError, 'Unable to load material categories.'))
      })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setSaving(true); setError('')
    const fileError = validateDocumentFile(file)
    if (fileError) {
      setError(fileError)
      setSaving(false)
      return
    }
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => payload.append(key, value))
      if (file) payload.append('file', file)
      const response = await lecturerService.uploadMaterial(payload, setProgress)
      const result = response?.data?.data ?? response?.data ?? response
      const id = result?.id ?? result?._id ?? result?.material?.id ?? result?.material?._id
      navigate(id != null ? `/lecturer/materials/${id}` : '/lecturer/my-materials', { replace: true })
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to upload the material.')) }
    finally { setSaving(false) }
  }

  return (
    <section>
      <PageHeader title="Upload material" description="Share a learning resource with your academic community." />
      {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label" htmlFor="material-title">{t('Title')}</label><input className="form-control" id="material-title" required maxLength="180" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="material-category">{t('Category')}</label><select className="form-select" id="material-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">{t('No category')}</option>{categories.map((category) => <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>)}</select></div>
            <div className="col-12"><label className="form-label" htmlFor="material-description">{t('Description')}</label><textarea className="form-control" id="material-description" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <div className="col-12"><label className="form-label" htmlFor="material-file">{t('Resource file')}</label><input className="form-control" id="material-file" type="file" accept={documentAccept} required onChange={(event) => { const selected = event.target.files?.[0] ?? null; const fileError = validateDocumentFile(selected); setError(fileError); setFile(fileError ? null : selected) }} /><div className="form-text">{t('PDF, DOC, DOCX, PPT, or PPTX · maximum 20 MB.')}</div></div>
          </div>
          {saving && <div className="mt-3"><label className="form-label" htmlFor="material-upload-progress">{t('Upload progress')}</label><progress id="material-upload-progress" className="w-100" max="100" value={progress}>{progress}%</progress><div className="small text-secondary">{progress}%</div></div>}
        </div>
        <div className="card-footer bg-white d-flex flex-wrap justify-content-end gap-2"><Link className="btn btn-outline-secondary" to="/lecturer/my-materials">{t('Cancel')}</Link><button className="btn btn-primary" type="submit" disabled={saving}>{t(saving ? 'Uploading…' : 'Submit material')}</button></div>
      </form>
    </section>
  )
}

export default UploadMaterial
