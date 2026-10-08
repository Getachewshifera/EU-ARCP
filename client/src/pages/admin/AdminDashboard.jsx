// Purpose: Administration overview and summary metrics.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/admin/StatCard.jsx'
import adminService from '../../services/adminService.js'

const metrics = [
  { key: 'users', label: 'Total users', accent: 'primary' },
  { key: 'pendingRegistrations', label: 'Pending registrations', accent: 'warning' },
  { key: 'materials', label: 'Learning materials', accent: 'success' },
  { key: 'openReports', label: 'Open reports', accent: 'danger' },
]

async function fetchDashboard() {
  const response = await adminService.getDashboard()
  return response.data?.data ?? response.data
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      setSummary(await fetchDashboard())
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function loadInitialDashboard() {
      try {
        const dashboard = await fetchDashboard()
        if (active) setSummary(dashboard)
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load the dashboard.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialDashboard()
    return () => { active = false }
  }, [])

  const data = summary?.metrics ?? summary?.stats ?? summary ?? {}

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Admin overview</h1>
          <p className="text-secondary mb-0">Monitor platform activity and manage academic resources.</p>
        </div>
        <button className="btn btn-outline-secondary" disabled={loading} onClick={loadDashboard} type="button">
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? (
        <div className="card card-body text-secondary" role="status">Loading dashboard…</div>
      ) : (
        <div className="row g-3 mb-4">
          {metrics.map(({ key, label, accent }) => (
            <div className="col-sm-6 col-xl-3" key={key}>
              <StatCard accent={accent} label={label} value={data[key] ?? data[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="h5 mb-3">Administrative workspace</h2>
          <p className="text-secondary">Choose an area to manage. Changes are submitted to the configured API.</p>
          <div className="d-flex flex-wrap gap-2">
            <Link className="btn btn-sm btn-outline-primary" to="/admin/users">Manage users</Link>
            <Link className="btn btn-sm btn-outline-primary" to="/admin/registrations">Review registrations</Link>
            <Link className="btn btn-sm btn-outline-primary" to="/admin/materials">Moderate materials</Link>
            <Link className="btn btn-sm btn-outline-primary" to="/admin/reports">Review reports</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
