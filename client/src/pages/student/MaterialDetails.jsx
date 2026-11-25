import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asEntity, displayPerson, formatDate, getErrorMessage, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState } from '../../components/portal/student/StudentUi.jsx'
import DownloadMaterialButton from '../../components/materials/DownloadMaterialButton.jsx'
import useLanguage from '../../hooks/useLanguage.js'

export default function MaterialDetails() {
  const { t } = useLanguage()
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMaterial = useCallback(async () => {
    try {
      setMaterial(asEntity(await studentService.getMaterial(id), ['material', 'item']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    const timer = window.setTimeout(loadMaterial, 0)
    return () => window.clearTimeout(timer)
  }, [loadMaterial])
  const retryMaterial = () => {
    setLoading(true)
    loadMaterial()
  }

  const author = displayPerson(material?.uploadedBy || material?.author || material?.uploader)

  return (
    <main className="container py-4">
      <PageHeader title="Material details" description="Resource information and download access."
        actions={<Link className="btn btn-outline-secondary" to="/student/materials">{t('Back to materials')}</Link>} />
      {loading ? <LoadingState label="Loading material…" /> : error ? <ErrorState message={error} onRetry={retryMaterial} /> : (
        <article className="card shadow-sm">
          <div className="card-body p-4">
            <h2 className="h3">{getRecordTitle(material)}</h2>
            {material?.description && <p className="mt-3 mb-4">{material.description}</p>}
            <dl className="row mb-0">
              {material?.course && <><dt className="col-sm-3">{t('Course')}</dt><dd className="col-sm-9">{material.course}</dd></>}
              {material?.subject && <><dt className="col-sm-3">{t('Subject')}</dt><dd className="col-sm-9">{material.subject}</dd></>}
              {author && <><dt className="col-sm-3">{t('Shared by')}</dt><dd className="col-sm-9">{author}</dd></>}
              {(material?.createdAt || material?.uploadedAt) && <><dt className="col-sm-3">{t('Added')}</dt><dd className="col-sm-9">{formatDate(material.createdAt || material.uploadedAt)}</dd></>}
              {material?.status && <><dt className="col-sm-3">{t('Status')}</dt><dd className="col-sm-9">{t(material.status)}</dd></>}
              {material?.fileName && <><dt className="col-sm-3">{t('File')}</dt><dd className="col-sm-9">{material.fileName}</dd></>}
            </dl>
          </div>
          <div className="card-footer bg-body">
            {material?.fileName ? <DownloadMaterialButton materialId={id} fileName={material.fileName} label="Open or download resource" /> : <p className="small text-body-secondary mb-0">{t('No downloadable file was included with this material.')}</p>}
          </div>
        </article>
      )}
    </main>
  )
}
