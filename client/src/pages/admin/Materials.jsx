// Purpose: Moderate and manage platform materials.
import { useEffect, useMemo, useState } from 'react'
import AdminListPage from '../../components/admin/AdminListPage.jsx'
import MaterialTable from '../../components/admin/MaterialTable.jsx'
import MaterialViewDialog from '../../components/admin/MaterialViewDialog.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import useAdminRecords from '../../hooks/useAdminRecords.js'
import adminService from '../../services/adminService.js'
import useLanguage from '../../hooks/useLanguage.js'
import { getItems, getRecordId } from '../../components/admin/adminData.js'

function getMaterialForm(material) {
  const category = material?.category
  return {
    title: material?.title || '',
    subject: material?.subject || '',
    course: material?.course || '',
    category: getRecordId(category),
    description: material?.description || '',
    rejectionReason: material?.rejectionReason || '',
  }
}

function MaterialEditDialog({ material, onClose, onSaved }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(() => getMaterialForm(material))
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!material) return undefined

    let active = true
    adminService.listResource('categories', { limit: 500 })
      .then((response) => {
        if (active) setCategories(getItems(response))
      })
      .catch((requestError) => {
        if (active) setError(t(requestError.response?.data?.message || requestError.message || 'Unable to load categories.'))
      })

    return () => { active = false }
  }, [material, t])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminService.updateMaterial(getRecordId(material), {
        title: form.title,
        subject: form.subject,
        course: form.course,
        category: form.category || null,
        description: form.description,
        rejectionReason: form.rejectionReason,
      })
      await onSaved()
      onClose()
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to update this material.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={Boolean(material)} onClose={onClose} title="Edit material details" size="lg">
      {material && (
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="admin-material-title">{t('Title')}</label>
              <input id="admin-material-title" className="form-control" maxLength="180" required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="admin-material-subject">{t('Subject')}</label>
              <input id="admin-material-subject" className="form-control" maxLength="160" value={form.subject || ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="admin-material-course">{t('Course')}</label>
              <input id="admin-material-course" className="form-control" maxLength="160" value={form.course || ''} onChange={(event) => setForm({ ...form, course: event.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="admin-material-category">{t('Category')}</label>
              <select id="admin-material-category" className="form-select" value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">{t('No category')}</option>
                {categories.map((category) => <option key={getRecordId(category)} value={getRecordId(category)}>{category.name}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="admin-material-description">{t('Description')}</label>
              <textarea id="admin-material-description" className="form-control" maxLength="4000" rows="4" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="admin-material-rejection">{t('Rejection reason')}</label>
              <textarea id="admin-material-rejection" className="form-control" maxLength="1000" rows="2" value={form.rejectionReason || ''} onChange={(event) => setForm({ ...form, rejectionReason: event.target.value })} />
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

function Materials() {
  const { t } = useLanguage()
  const { records, loading, busyId, error, reload, runAction } = useAdminRecords(adminService.getMaterials)
  const [status, setStatus] = useState('')
  const [viewingMaterial, setViewingMaterial] = useState(null)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [deletingMaterial, setDeletingMaterial] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const materials = useMemo(
    () => status ? records.filter((item) => (item.status || 'pending') === status) : records,
    [records, status],
  )

  function reviewMaterial(material, nextStatus) {
    const id = material._id ?? material.id
    runAction(id, () => adminService.updateMaterial(id, { status: nextStatus }))
  }

  async function confirmDeleteMaterial() {
    const id = getRecordId(deletingMaterial)
    if (!id) return
    setDeleting(true)
    try {
      const succeeded = await runAction(id, () => adminService.deleteMaterial(id))
      if (succeeded) setDeletingMaterial(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminListPage
      description="Review submitted learning materials and control their publication status."
      loading={loading}
      onRefresh={reload}
      records={materials}
      title="Materials"
      toolbar={(
        <>
          <span className="fw-semibold">{materials.length} materials</span>
          <select aria-label={t('Filter materials by status')} className="form-select" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">{t('All statuses')}</option>
            <option value="pending">{t('Pending')}</option>
            <option value="approved">{t('Approved')}</option>
            <option value="rejected">{t('Rejected')}</option>
          </select>
        </>
      )}
      error={error}
    >
      <MaterialTable
        busyId={busyId}
        materials={materials}
        onEdit={setEditingMaterial}
        onDelete={setDeletingMaterial}
        onReview={reviewMaterial}
        onView={setViewingMaterial}
      />
      <MaterialViewDialog material={viewingMaterial} onClose={() => setViewingMaterial(null)} />
      <MaterialEditDialog key={getRecordId(editingMaterial) || 'no-material'} material={editingMaterial} onClose={() => setEditingMaterial(null)} onSaved={reload} />
      <ConfirmDialog open={Boolean(deletingMaterial)} title="Delete material"
        message="This permanently deletes the document and its stored file." confirmLabel="Delete"
        cancelLabel="Cancel" destructive loading={deleting} onConfirm={confirmDeleteMaterial}
        onCancel={() => setDeletingMaterial(null)} />
    </AdminListPage>
  )
}

export default Materials
