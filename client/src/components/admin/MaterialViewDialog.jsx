// Purpose: Shows material details and a browser preview of its uploaded file.
import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import adminService from '../../services/adminService.js'
import { displayValue, formatAdminDate } from './adminData.js'

// Format a user object that may have firstName/lastName or a combined name
function formatUser(user) {
  if (!user) return '—'
  if (typeof user === 'string') return user
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return user.name || user.email || '—'
}

// Format a category that may be a populated object or a plain string
function formatCategory(cat) {
  if (!cat) return '—'
  if (typeof cat === 'string') return cat
  return cat.name || cat.title || '—'
}

function MaterialViewDialog({ material, onClose }) {
  const [loadState, setLoadState] = useState(null)

  const id = material?._id ?? material?.id
  const currentLoad = loadState?.id === id
    ? loadState
    : { loading: Boolean(id), error: '', fileUrl: '' }

  useEffect(() => {
    if (!id) return undefined

    let active = true
    let objectUrl = ''

    adminService.getMaterialFile(id)
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data)
        if (active) {
          setLoadState({ id, loading: false, error: '', fileUrl: objectUrl })
        } else {
          URL.revokeObjectURL(objectUrl)
        }
      })
      .catch(() => {
        if (active) {
          setLoadState({ id, loading: false, error: 'Unable to load the material file. Please try again.', fileUrl: '' })
        }
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  const mimeType = String(material?.mimeType || '')
  const canPreview = mimeType === 'application/pdf'
    || mimeType.startsWith('image/')
    || mimeType.startsWith('text/')

  return (
    <Modal open={Boolean(material)} onClose={onClose} size="xl" title={material?.title || 'Material details'}>
      {material && (
        <>
          <dl className="row mb-3">
            <dt className="col-sm-3">Category</dt>
            <dd className="col-sm-9">{formatCategory(material.category)}</dd>
            <dt className="col-sm-3">Submitted by</dt>
            <dd className="col-sm-9">{formatUser(material.uploader || material.uploadedBy || material.owner)}</dd>
            <dt className="col-sm-3">Status</dt>
            <dd className="col-sm-9">{displayValue(material.status)}</dd>
            <dt className="col-sm-3">Submitted</dt>
            <dd className="col-sm-9">{formatAdminDate(material.createdAt)}</dd>
            {material.description && (
              <>
                <dt className="col-sm-3">Description</dt>
                <dd className="col-sm-9">{material.description}</dd>
              </>
            )}
            <dt className="col-sm-3">File</dt>
            <dd className="col-sm-9">{material.fileName || 'Uploaded material'}</dd>
          </dl>

          {currentLoad.loading && <div className="py-5 text-center" role="status">Loading material preview…</div>}
          {currentLoad.error && <div className="alert alert-danger" role="alert">{currentLoad.error}</div>}
          {!currentLoad.loading && currentLoad.fileUrl && canPreview && (
            <div className="border rounded overflow-hidden" style={{ height: '65vh' }}>
              {mimeType.startsWith('image/') ? (
                <img alt={material.title || 'Material preview'} className="w-100 h-100 object-fit-contain" src={currentLoad.fileUrl} />
              ) : mimeType.startsWith('text/') ? (
                <iframe className="w-100 h-100 border-0" title={`${material.title || 'Material'} preview`} src={currentLoad.fileUrl} />
              ) : (
                <iframe className="w-100 h-100 border-0" title={`${material.title || 'Material'} preview`} src={currentLoad.fileUrl} />
              )}
            </div>
          )}
          {!currentLoad.loading && currentLoad.fileUrl && !canPreview && (
            <div className="alert alert-info" role="status">
              This file type cannot be previewed in the browser. Download it to view the material.
            </div>
          )}
          {!currentLoad.loading && currentLoad.fileUrl && (
            <div className="d-flex justify-content-end mt-3">
              <a className="btn btn-primary" download={material.fileName || true} href={currentLoad.fileUrl}>Download material</a>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

export default MaterialViewDialog
