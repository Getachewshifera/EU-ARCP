import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { displayDate, errorMessage, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function MaterialDetails() {
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const result = unwrap(await lecturerService.getMaterial(id))
      setMaterial(result?.material ?? result)
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to load this material.')) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  return (
    <section>
      <PageHeader title={material?.title || material?.name || 'Material details'} description="Learning resource information." actions={<Link className="btn btn-outline-secondary" to="/lecturer/materials">Back to materials</Link>} />
      <RequestState error={error} loading={loading} onRetry={refresh} />
      {!loading && !error && material && <article className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><h2 className="h4 mb-0">{material.title || material.name || 'Untitled material'}</h2>{material.status && <span className="badge text-bg-secondary align-self-start">{material.status}</span>}</div>
          <dl className="row">
            <dt className="col-sm-3">Category</dt><dd className="col-sm-9">{material.category || material.subject || '—'}</dd>
            <dt className="col-sm-3">Submitted</dt><dd className="col-sm-9">{displayDate(material.createdAt || material.created_at)}</dd>
            {(material.author?.name || material.lecturer?.name) && <><dt className="col-sm-3">Lecturer</dt><dd className="col-sm-9">{material.author?.name || material.lecturer?.name}</dd></>}
            <dt className="col-sm-3">Description</dt><dd className="col-sm-9 text-break">{material.description || 'No description provided.'}</dd>
          </dl>
          {(material.fileUrl || material.file_url || material.url) && <a className="btn btn-primary" href={material.fileUrl || material.file_url || material.url} target="_blank" rel="noreferrer">Open or download resource</a>}
        </div>
      </article>}
      {!loading && !error && !material && <div className="alert alert-warning">The requested material was not found.</div>}
    </section>
  )
}

export default MaterialDetails
