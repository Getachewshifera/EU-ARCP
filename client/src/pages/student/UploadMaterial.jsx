import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import materialService from '../../services/materialService.js'
import { asEntity, getErrorMessage, getRecordId } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, Notice } from '../../components/portal/student/StudentUi.jsx'
import { documentAccept, validateDocumentFile } from '../../utils/documentFile.js'
import useLanguage from '../../hooks/useLanguage.js'

export default function UploadMaterial() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [form, setForm] = useState({ title: '', description: '', course: '', subject: '', category: '' })
  const [categories, setCategories] = useState([])
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    materialService.listCategories()
      .then((response) => {
        const payload = response?.data?.data ?? response?.data
        const items = Array.isArray(payload) ? payload : payload?.items ?? payload?.results
        if (active && Array.isArray(items)) setCategories(items)
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const fileError = validateDocumentFile(file)
    if (fileError) {
      setError(t(fileError))
      return
    }
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('file', file)
    setSaving(true)
    try {
      const result = asEntity(await studentService.uploadMaterial(data, setProgress), ['material', 'item'])
      const id = getRecordId(result)
      if (id) navigate(`/student/materials/${encodeURIComponent(id)}`)
      else {
        setNotice(t('Your material was submitted.'))
        setForm({ title: '', description: '', course: '', subject: '', category: '' })
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
        actions={<Link className="btn btn-outline-secondary" to="/student/my-materials">{t('My materials')}</Link>} />
      {error && <Notice variant="danger">{error}</Notice>}
      <Notice>{notice}</Notice>
      <form ref={formRef} className="card shadow-sm" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="material-title" className="form-label">{t('Title')} <span className="text-danger">*</span></label>
              <input id="material-title" name="title" className="form-control" required maxLength="180" value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="material-course" className="form-label">{t('Course')}</label>
              <input id="material-course" name="course" className="form-control" value={form.course}
                onChange={(event) => setForm({ ...form, course: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="material-category" className="form-label">{t('Category')}</label>
              <select id="material-category" name="category" className="form-select" value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">{t('No category')}</option>
                {categories.map((category) => <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="material-subject" className="form-label">{t('Subject or topic')}</label>
              <input id="material-subject" name="subject" className="form-control" value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <div className="col-12">
              <label htmlFor="material-description" className="form-label">{t('Description')}</label>
              <textarea id="material-description" name="description" className="form-control" rows="4" value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="col-12">
              <label htmlFor="material-file" className="form-label">{t('File')} <span className="text-danger">*</span></label>
              <input id="material-file" name="file" className="form-control" type="file" accept={documentAccept} required onChange={(event) => { const selected = event.target.files?.[0] || null; const fileError = validateDocumentFile(selected); setError(fileError ? t(fileError) : ''); setFile(fileError ? null : selected) }} />
              <div className="form-text">{t('PDF, DOC, DOCX, PPT, or PPTX · maximum 20 MB.')}</div>
            </div>
          </div>
          {saving && <div className="mt-3"><label htmlFor="material-upload-progress" className="form-label">{t('Upload progress')}</label><progress id="material-upload-progress" className="w-100" max="100" value={progress}>{progress}%</progress><div className="small text-body-secondary">{progress}%</div></div>}
        </div>
        <div className="card-footer bg-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <Link to="/student/materials" className="link-secondary">{t('Cancel')}</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>{t(saving ? 'Uploading…' : 'Submit material')}</button>
        </div>
      </form>
    </main>
  )
}
