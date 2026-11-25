import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import MaterialMetadataDialog from '../../components/materials/MaterialMetadataDialog.jsx'
import lecturerService from '../../services/lecturerService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'
import useLanguage from '../../hooks/useLanguage.js'

function MyMaterials() {
  const { t } = useLanguage()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [deletingMaterial, setDeletingMaterial] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMaterials(listFrom(unwrap(await lecturerService.getMyMaterials({})), 'materials'))
      setError('')
    }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to load your materials.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  async function confirmDelete() {
    const id = itemId(deletingMaterial)
    if (id == null) return
    setDeleting(true)
    setError('')
    try {
      await lecturerService.deleteMaterial(id)
      setDeletingMaterial(null)
      setNotice(t('Material deleted.'))
      await load()
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to delete this material.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <PageHeader title="My materials" description="Track the learning resources you have submitted." actions={<Link className="btn btn-primary" to="/lecturer/upload-material">{t('Upload material')}</Link>} />
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <RequestState error={error} loading={loading} onRetry={refresh} />
      {!loading && !error && <div className="card">
        {materials.length ? <div className="table-responsive"><table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th scope="col">{t('Title')}</th><th scope="col">{t('Category')}</th><th scope="col">{t('Status')}</th><th scope="col">{t('Submitted')}</th><th scope="col"><span className="visually-hidden">{t('Actions')}</span></th></tr></thead>
          <tbody>{materials.map((material, index) => <tr key={itemId(material) ?? index}>
            <td className="fw-medium">{material.title || material.name || t('Untitled material')}</td><td>{material.category || material.subject || '—'}</td>
            <td><span className="badge text-bg-secondary">{t(material.status || '—')}</span></td><td>{material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '—'}</td>
            <td>{itemId(material) != null && <div className="d-flex justify-content-end gap-2">
              <Link className="btn btn-sm btn-outline-primary" to={`/lecturer/materials/${itemId(material)}`}>{t('Details')}</Link>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditingMaterial(material)}>{t('Edit')}</button>
              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeletingMaterial(material)}>{t('Delete')}</button>
            </div>}</td>
          </tr>)}</tbody>
        </table></div> : <EmptyState title={t('No submitted materials')}>{t('Your uploads will appear here when available.')}</EmptyState>}
      </div>}
      <MaterialMetadataDialog key={itemId(editingMaterial) || 'no-material'} material={editingMaterial}
        onClose={() => setEditingMaterial(null)} onSaved={load} />
      <ConfirmDialog open={Boolean(deletingMaterial)} title="Delete material"
        message="This permanently deletes the document and its stored file." confirmLabel="Delete"
        cancelLabel="Cancel" destructive loading={deleting} onConfirm={confirmDelete}
        onCancel={() => setDeletingMaterial(null)} />
    </section>
  )
}

export default MyMaterials
