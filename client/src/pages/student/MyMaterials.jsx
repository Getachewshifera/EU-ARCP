import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asList, formatDate, getErrorMessage, getRecordId, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/portal/student/StudentUi.jsx'

export default function MyMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')

  const loadMaterials = useCallback(async () => {
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

  return (
    <main className="container py-4">
      <PageHeader title="My materials" description="Track resources you have shared with the learning community."
        actions={<Link className="btn btn-primary" to="/student/materials/upload">Upload material</Link>} />
      <form className="input-group mb-4" role="search" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="my-material-search">Search my materials</label>
        <input id="my-material-search" className="form-control" type="search" placeholder="Search your uploads" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-outline-primary" type="submit">Search</button>
      </form>
      {loading ? <LoadingState label="Loading your materials…" /> : error ? <ErrorState message={error} onRetry={retryMaterials} /> : materials.length === 0
        ? <EmptyState title={query ? 'No matching uploads' : 'You have not shared any materials yet'} description={query ? 'Try another search term.' : 'Upload a resource to make it available to other students.'} />
        : <div className="table-responsive border rounded-3">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th scope="col">Title</th><th scope="col">Course / subject</th><th scope="col">Status</th><th scope="col">Submitted</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>{materials.map((material, index) => {
              const id = getRecordId(material)
              return <tr key={id || `${getRecordTitle(material)}-${index}`}>
                <th scope="row">{id ? <Link to={`/student/materials/${encodeURIComponent(id)}`}>{getRecordTitle(material)}</Link> : getRecordTitle(material)}</th>
                <td>{material.course || material.subject || '—'}</td>
                <td><span className="badge text-bg-secondary">{material.status || 'Submitted'}</span></td>
                <td>{formatDate(material.createdAt || material.uploadedAt) || '—'}</td>
                <td className="text-end">{id && <Link className="btn btn-sm btn-outline-primary" to={`/student/materials/${encodeURIComponent(id)}`}>Details</Link>}</td>
              </tr>
            })}</tbody>
          </table>
        </div>}
    </main>
  )
}
