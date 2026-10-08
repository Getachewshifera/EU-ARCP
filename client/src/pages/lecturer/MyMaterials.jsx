import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function MyMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try { setMaterials(listFrom(unwrap(await lecturerService.getMyMaterials({})), 'materials')) }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to load your materials.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  return (
    <section>
      <PageHeader title="My materials" description="Track the learning resources you have submitted." actions={<Link className="btn btn-primary" to="/lecturer/upload-material">Upload material</Link>} />
      <RequestState error={error} loading={loading} onRetry={refresh} />
      {!loading && !error && <div className="card">
        {materials.length ? <div className="table-responsive"><table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Submitted</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>{materials.map((material, index) => <tr key={itemId(material) ?? index}>
            <td className="fw-medium">{material.title || material.name || 'Untitled material'}</td><td>{material.category || material.subject || '—'}</td>
            <td><span className="badge text-bg-secondary">{material.status || '—'}</span></td><td>{material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '—'}</td>
            <td>{itemId(material) != null && <Link className="btn btn-sm btn-outline-primary" to={`/lecturer/materials/${itemId(material)}`}>Details</Link>}</td>
          </tr>)}</tbody>
        </table></div> : <EmptyState title="No submitted materials">Your uploads will appear here when available.</EmptyState>}
      </div>}
    </section>
  )
}

export default MyMaterials
