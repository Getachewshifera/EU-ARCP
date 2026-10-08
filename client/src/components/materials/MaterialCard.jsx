// Purpose: Summary card for a learning material.
import { Link } from 'react-router-dom'

function MaterialCard({ material, to, onDownload }) {
  const id = material?._id ?? material?.id
  const detailPath = to || (id ? `/materials/${id}` : '/login')
  const author = material?.uploadedBy?.name || material?.author?.name || material?.uploader?.name
    || material?.uploadedBy?.email || 'Community member'
  const dateValue = material?.createdAt || material?.updatedAt
  const date = dateValue ? new Date(dateValue) : null
  const validDate = date && !Number.isNaN(date.getTime())

  return (
    <article className="card h-100 border-0 shadow-sm material-card">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between gap-2 align-items-start">
          <span className="badge text-bg-primary-subtle text-primary">{material?.category?.name || material?.category || 'Resource'}</span>
          {material?.fileType && <span className="small text-secondary text-uppercase">{material.fileType}</span>}
        </div>
        <h2 className="h5 mt-3">
          <Link className="text-decoration-none text-dark" to={detailPath}>{material?.title || 'Untitled material'}</Link>
        </h2>
        <p className="text-secondary small flex-grow-1">{material?.description || 'Open this resource to view its details.'}</p>
        <div className="d-flex align-items-center justify-content-between gap-2 border-top pt-3">
          <div className="small text-secondary">
            <div>{author}</div>
            {validDate && <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>}
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-sm btn-outline-primary" to={detailPath}>Details</Link>
            {material?.fileUrl && onDownload && (
              <a className="btn btn-sm btn-primary" href={material.fileUrl} onClick={onDownload} rel="noreferrer" target="_blank">Open</a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default MaterialCard
