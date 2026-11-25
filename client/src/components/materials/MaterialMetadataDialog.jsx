// Purpose: Lets material owners update their descriptive metadata.
import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import materialService from '../../services/materialService.js'
import useLanguage from '../../hooks/useLanguage.js'

function MaterialMetadataDialog({ material, onClose, onSaved }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    title: material?.title || '',
    subject: material?.subject || '',
    course: material?.course || '',
    description: material?.description || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await materialService.update(material._id || material.id, form)
      await onSaved()
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to update this material.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={Boolean(material)} onClose={saving ? undefined : onClose} title="Edit material details" size="lg">
      {material && (
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="owner-material-title">{t('Title')}</label>
              <input id="owner-material-title" className="form-control" maxLength="180" required value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="owner-material-course">{t('Course')}</label>
              <input id="owner-material-course" className="form-control" maxLength="160" value={form.course}
                onChange={(event) => setForm({ ...form, course: event.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="owner-material-subject">{t('Subject')}</label>
              <input id="owner-material-subject" className="form-control" maxLength="160" value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="owner-material-description">{t('Description')}</label>
              <textarea id="owner-material-description" className="form-control" maxLength="4000" rows="4" value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>{t('Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{t(saving ? 'Saving…' : 'Save changes')}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default MaterialMetadataDialog
