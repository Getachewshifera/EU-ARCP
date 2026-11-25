import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import MaterialMetadataDialog from '../../components/materials/MaterialMetadataDialog.jsx'
import studentService from '../../services/studentService.js'
import { asList, formatDate, getErrorMessage, getRecordId, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState, Notice } from '../../components/portal/student/StudentUi.jsx'
import useLanguage from '../../hooks/useLanguage.js'

export default function MyMaterials() {
  const { t } = useLanguage()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [deletingMaterial, setDeletingMaterial] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState('')

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    try {
      setMaterials(asList(await studentService.getMyMaterials(query ? { search: query } : {}), ['materials']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [query])
  useEffect(() => {
    const timer = window.setTimeout(loadMaterials, 0)
    return () => window.clearTimeout(timer)
  }, [loadMaterials])
  const retryMaterials = () => {
    setLoading(true)
    loadMaterials()
  }
  const submitSearch = (event) => {
    event.preventDefault()
    const nextQuery = search.trim()
    setLoading(true)
    if (nextQuery === query) loadMaterials()
    else setQuery(nextQuery)
  }

  async function confirmDelete() {
    const id = getRecordId(deletingMaterial)
    if (!id) return
    setDeleting(true)
    setError('')
    try {
      await studentService.deleteMaterial(id)
      setDeletingMaterial(null)
      setNotice(t('Material deleted.'))
      await loadMaterials()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="My materials" description="Track resources you have shared with the learning community."
        actions={<Link className="btn btn-primary" to="/student/materials/upload">{t('Upload material')}</Link>} />
      <form className="input-group mb-4" role="search" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="my-material-search">{t('Search my materials')}</label>
        <input id="my-material-search" className="form-control" type="search" placeholder={t('Search your uploads')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-outline-primary" type="submit">{t('Search')}</button>
      </form>
      {notice && <Notice>{notice}</Notice>}
      {loading ? <LoadingState label="Loading your materials…" /> : error ? <ErrorState message={error} onRetry={retryMaterials} /> : materials.length === 0
        ? <EmptyState title={t(query ? 'No matching uploads' : 'You have not shared any materials yet')} description={t(query ? 'Try another search term.' : 'Upload a resource to make it available to other students.')} />
        : <div className="table-responsive border rounded-3">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th scope="col">{t('Title')}</th><th scope="col">{t('Course / subject')}</th><th scope="col">{t('Status')}</th><th scope="col">{t('Submitted')}</th><th scope="col"><span className="visually-hidden">{t('Actions')}</span></th></tr></thead>
            <tbody>{materials.map((material, index) => {
              const id = getRecordId(material)
              return <tr key={id || `${getRecordTitle(material)}-${index}`}>
                <th scope="row">{id ? <Link to={`/student/materials/${encodeURIComponent(id)}`}>{getRecordTitle(material)}</Link> : getRecordTitle(material)}</th>
                <td>{material.course || material.subject || '—'}</td>
                <td><span className="badge text-bg-secondary">{t(material.status || 'Submitted')}</span></td>
                <td>{formatDate(material.createdAt || material.uploadedAt) || '—'}</td>
                <td className="text-end">
                  {id && <div className="d-flex justify-content-end gap-2">
                    <Link className="btn btn-sm btn-outline-primary" to={`/student/materials/${encodeURIComponent(id)}`}>{t('Details')}</Link>
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditingMaterial(material)}>{t('Edit')}</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeletingMaterial(material)}>{t('Delete')}</button>
                  </div>}
                </td>
              </tr>
            })}</tbody>
          </table>
        </div>}
      <MaterialMetadataDialog key={getRecordId(editingMaterial) || 'no-material'} material={editingMaterial}
        onClose={() => setEditingMaterial(null)} onSaved={loadMaterials} />
      <ConfirmDialog open={Boolean(deletingMaterial)} title="Delete material"
        message="This permanently deletes the document and its stored file." confirmLabel="Delete"
        cancelLabel="Cancel" destructive loading={deleting} onConfirm={confirmDelete}
        onCancel={() => setDeletingMaterial(null)} />
    </main>
  )
}
