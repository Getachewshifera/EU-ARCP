import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MaterialFilters from '../../components/materials/MaterialFilters.jsx'
import studentService from '../../services/studentService.js'
import { asList, formatDate, getErrorMessage, getRecordId, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/portal/student/StudentUi.jsx'
import useLanguage from '../../hooks/useLanguage.js'

export default function Materials() {
  const { t } = useLanguage()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', university: '', department: '' })

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    try {
      setMaterials(asList(await studentService.listMaterials({
        search: query || undefined,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      }), ['materials']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [filters, query])
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

  return (
    <main className="container py-4">
      <PageHeader title="Browse materials" description="Search the learning resources available to students."
        actions={<Link className="btn btn-primary" to="/student/materials/upload">{t('Share a material')}</Link>} />
      <form className="row g-2 mb-4" role="search" onSubmit={submitSearch}>
        <div className="col"><label className="visually-hidden" htmlFor="material-search">{t('Search materials')}</label>
          <input id="material-search" className="form-control" type="search" placeholder={t('Search by title, course, or topic')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="col-auto"><button className="btn btn-outline-primary" type="submit">{t('Search')}</button></div>
        {query && <div className="col-auto"><button className="btn btn-outline-secondary" type="button" onClick={() => { setLoading(true); setSearch(''); setQuery('') }}>{t('Clear')}</button></div>}
      </form>
      <MaterialFilters filters={filters} onChange={setFilters} />
      {loading ? <LoadingState label="Loading materials…" /> : error ? <ErrorState message={error} onRetry={retryMaterials} /> : materials.length === 0
        ? <EmptyState title={query ? 'No matching materials' : 'No materials available'} description={query ? 'Try a different search term.' : 'Shared resources will appear here when they are available.'} />
        : <div className="row g-3">
          {materials.map((material, index) => {
            const id = getRecordId(material)
            const author = material.uploadedBy?.name || material.author?.name || material.uploader?.name || material.uploadedBy || material.author
            return <div className="col-12 col-md-6 col-xl-4" key={id || `${getRecordTitle(material)}-${index}`}>
              <article className="card h-100 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 card-title">{id ? <Link to={`/student/materials/${encodeURIComponent(id)}`}>{getRecordTitle(material)}</Link> : getRecordTitle(material)}</h2>
                  {material.course && <p className="small text-body-secondary mb-1">{material.course}</p>}
                  {material.subject && <p className="small text-body-secondary mb-2">{material.subject}</p>}
                  <p className="card-text">{material.description || t('No description provided.')}</p>
                  <div className="small text-body-secondary">
                    {author && <span>{t('Shared by')} {typeof author === 'string' ? author : author.name || author.email}</span>}
                    {material.createdAt && <span>{author ? ' · ' : ''}{formatDate(material.createdAt)}</span>}
                  </div>
                </div>
                <div className="card-footer bg-body">
                  {id ? <Link className="btn btn-sm btn-outline-primary" to={`/student/materials/${encodeURIComponent(id)}`}>{t('View details')}</Link> : <span className="small text-body-secondary">{t('Details unavailable')}</span>}
                </div>
              </article>
            </div>
          })}
        </div>}
    </main>
  )
}
