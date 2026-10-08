import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function LecturerMaterials() {
  const [materials, setMaterials] = useState([])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (term = search) => {
    try {
      const result = unwrap(await lecturerService.listMaterials({ search: term || undefined }))
      setMaterials(listFrom(result, 'materials'))
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to load materials.')) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  function refresh() {
    setLoading(true); setError('')
    void load()
  }

  function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSearch(query)
  }

  return (
    <section>
      <PageHeader title="Learning materials" description="Browse learning resources available to you." actions={<Link className="btn btn-primary" to="/lecturer/upload-material">Upload material</Link>} />
      <form className="row g-2 mb-3" role="search" onSubmit={submit}>
        <div className="col-sm"><label className="visually-hidden" htmlFor="material-search">Search materials</label><input id="material-search" className="form-control" placeholder="Search by title or keyword" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="col-auto"><button className="btn btn-outline-primary" type="submit">Search</button></div>
      </form>
      <RequestState error={error} loading={loading} onRetry={refresh} />
      {!loading && !error && (materials.length ? <div className="row g-3">
        {materials.map((material, index) => <div className="col-md-6 col-xl-4" key={itemId(material) ?? index}>
          <article className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between gap-2">
                <h2 className="h5">{itemId(material) != null ? <Link className="text-decoration-none" to={`/lecturer/materials/${itemId(material)}`}>{material.title || material.name || 'Untitled material'}</Link> : (material.title || material.name || 'Untitled material')}</h2>
                {material.status && <span className="badge text-bg-light align-self-start">{material.status}</span>}
              </div>
              <p className="text-secondary">{material.description || 'No description provided.'}</p>
              <div className="small text-secondary">{material.category || material.subject || 'Uncategorized'}{material.createdAt ? ` · ${new Date(material.createdAt).toLocaleDateString()}` : ''}</div>
            </div>
            {material.fileUrl && <div className="card-footer bg-white"><a href={material.fileUrl} target="_blank" rel="noreferrer">Open resource</a></div>}
          </article>
        </div>)}
      </div> : <div className="card"><div className="card-body"><p className="text-secondary mb-0">No materials matched your search.</p></div></div>)}
    </section>
  )
}

export default LecturerMaterials
