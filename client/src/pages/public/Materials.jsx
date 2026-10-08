import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MaterialCard from '../../components/materials/MaterialCard.jsx'
import Navbar from '../../components/layout/Navbar.jsx'
import materialService from '../../services/materialService.js'

function getMaterialItems(response) {
  const payload = response?.data?.data ?? response?.data
  const items = Array.isArray(payload) ? payload : payload?.items ?? payload?.results
  if (!Array.isArray(items)) throw new Error('The API response did not contain a list of materials.')
  return items
}

function Materials() {
  const [materials, setMaterials] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await materialService.list({ search: query.trim() || undefined })
      setMaterials(getMaterialItems(response))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load learning materials.')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const timeout = window.setTimeout(loadMaterials, 250)
    return () => window.clearTimeout(timeout)
  }, [loadMaterials])

  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <h1 className="h2 mb-1">Learning resources</h1>
            <p className="text-secondary mb-0">Discover materials shared by the academic community.</p>
          </div>
          <Link className="btn btn-primary" to="/login">Sign in to contribute</Link>
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="public-material-search">Search resources</label>
          <input
            className="form-control"
            id="public-material-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and descriptions"
            type="search"
            value={query}
          />
        </div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {loading ? (
          <div className="text-secondary" role="status">Loading resources…</div>
        ) : materials.length ? (
          <div className="row g-3">
            {materials.map((material, index) => (
              <div className="col-md-6 col-xl-4" key={material._id || material.id || index}>
                <MaterialCard material={material} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card card-body text-center text-secondary py-5">
            No learning materials are available{query ? ' for this search' : ' yet'}.
          </div>
        )}
      </main>
    </>
  )
}

export default Materials
