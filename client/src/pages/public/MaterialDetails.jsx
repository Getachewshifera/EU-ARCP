import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar.jsx'
import materialService from '../../services/materialService.js'

function MaterialDetails() {
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    materialService.get(id)
      .then((response) => {
        if (active) setMaterial(response.data?.data ?? response.data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load this material.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  return (
    <>
      <Navbar />
      <main className="container py-5" style={{ maxWidth: '56rem' }}>
        <Link to="/materials">← All resources</Link>
        {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
        {loading ? (
          <div className="py-5 text-secondary" role="status">Loading material…</div>
        ) : material ? (
          <article className="card border-0 shadow-sm mt-3">
            <div className="card-body p-4 p-md-5">
              <span className="badge text-bg-primary-subtle text-primary">{material.category?.name || material.category || 'Resource'}</span>
              <h1 className="h2 mt-3">{material.title || 'Learning material'}</h1>
              <p className="text-secondary">{material.description || 'No description was provided.'}</p>
              <dl className="row mt-4">
                <dt className="col-sm-3">Contributor</dt><dd className="col-sm-9">{material.uploadedBy?.name || material.author?.name || 'Community member'}</dd>
                <dt className="col-sm-3">Course</dt><dd className="col-sm-9">{material.course?.title || material.course || '—'}</dd>
                <dt className="col-sm-3">File type</dt><dd className="col-sm-9">{material.fileType || material.mimeType || '—'}</dd>
              </dl>
              {material.fileUrl && <a className="btn btn-primary" href={material.fileUrl} rel="noreferrer" target="_blank">Open material</a>}
            </div>
          </article>
        ) : (
          <div className="alert alert-warning mt-3" role="status">This material is not available.</div>
        )}
      </main>
    </>
  )
}

export default MaterialDetails
