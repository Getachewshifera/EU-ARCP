import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar.jsx'
import useLanguage from '../../hooks/useLanguage.js'
import useAuth from '../../hooks/useAuth.js'
import DownloadMaterialButton from '../../components/materials/DownloadMaterialButton.jsx'
import materialService from '../../services/materialService.js'

function MaterialDetails() {
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadMaterial() {
      try {
        const response = await materialService.get(id)
        if (active) setMaterial(response.data?.data ?? response.data)
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load this material.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      setMaterial(null)
      void loadMaterial()
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [id])

  return (
    <>
      <Navbar />
      <main className="container py-5" style={{ maxWidth: '56rem' }}>
        <Link to="/materials">← All resources</Link>
        {error && <div className="alert alert-danger mt-3" role="alert">{t(error)}</div>}
        {loading ? (
          <div className="py-5 text-secondary" role="status">{t('Loading material…')}</div>
        ) : material ? (
          <article className="card border-0 shadow-sm mt-3">
            <div className="card-body p-4 p-md-5">
              <span className="badge text-bg-primary-subtle text-primary">{material.category?.name || material.category || t('Resource')}</span>
              <h1 className="h2 mt-3">{material.title || t('Learning material')}</h1>
              <p className="text-secondary">{material.description || t('No description was provided.')}</p>
              <dl className="row mt-4">
                <dt className="col-sm-3">{t('Contributor')}</dt><dd className="col-sm-9">{material.uploadedBy?.name || material.author?.name || t('Community member')}</dd>
                <dt className="col-sm-3">{t('Course')}</dt><dd className="col-sm-9">{material.course?.title || material.course || '—'}</dd>
                <dt className="col-sm-3">{t('File type')}</dt><dd className="col-sm-9">{material.fileType || material.mimeType || '—'}</dd>
              </dl>
              {isAuthenticated
                ? <DownloadMaterialButton materialId={id} fileName={material.fileName} label="Open or download resource" />
                : <Link className="btn btn-primary" to="/login">{t('Sign in to download')}</Link>}
            </div>
          </article>
        ) : (
          <div className="alert alert-warning mt-3" role="status">{t('This material is not available.')}</div>
        )}
      </main>
    </>
  )
}

export default MaterialDetails
