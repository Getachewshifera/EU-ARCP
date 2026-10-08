import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

const stats = [
  ['materials', 'My materials'],
  ['groups', 'Groups'],
  ['unreadNotifications', 'Unread notifications'],
  ['unreadMessages', 'Unread messages'],
]

function LecturerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setDashboard(unwrap(await lecturerService.getDashboard()))
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to load the dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  const data = dashboard?.metrics ?? dashboard?.stats ?? dashboard ?? {}
  const materials = listFrom(dashboard?.recentMaterials, 'materials')
  const notifications = listFrom(dashboard?.recentNotifications, 'notifications')

  return (
    <section>
      <PageHeader title="Lecturer dashboard" description="A quick overview of your teaching workspace."
        actions={<button className="btn btn-outline-secondary" disabled={loading} onClick={refresh} type="button">Refresh</button>} />
      <RequestState error={error} loading={loading} onRetry={refresh} />
      {!loading && !error && (
        <>
          <div className="row g-3 mb-4">
            {stats.map(([key, label]) => (
              <div className="col-6 col-xl-3" key={key}>
                <div className="card h-100"><div className="card-body">
                  <div className="text-secondary small">{label}</div>
                  <div className="fs-3 fw-semibold">{data[key] ?? data[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] ?? '—'}</div>
                </div></div>
              </div>
            ))}
          </div>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h2 className="h5 mb-0">Recent materials</h2><Link to="/lecturer/my-materials">View all</Link>
                </div>
                <div className="card-body">
                  {materials.length ? <div className="list-group list-group-flush">
                    {materials.map((material, index) => <div className="list-group-item px-0" key={itemId(material) ?? index}>
                      <Link to={itemId(material) != null ? `/lecturer/materials/${itemId(material)}` : '/lecturer/my-materials'} className="fw-medium text-decoration-none">{material.title || material.name || 'Untitled material'}</Link>
                      <div className="small text-secondary">{material.status || material.category || 'Material'}</div>
                    </div>)}
                  </div> : <p className="text-secondary mb-0">No recent materials are available.</p>}
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header bg-white"><h2 className="h5 mb-0">Recent notifications</h2></div>
                <div className="card-body">
                  {notifications.length ? <ul className="list-unstyled mb-0">
                    {notifications.slice(0, 5).map((notification, index) => <li className="border-bottom py-2" key={itemId(notification) ?? index}>
                      <div className="fw-medium">{notification.title || notification.message || 'Notification'}</div>
                      {notification.createdAt && <small className="text-secondary">{new Date(notification.createdAt).toLocaleString()}</small>}
                    </li>)}
                  </ul> : <p className="text-secondary mb-0">No recent notifications are available.</p>}
                  <Link className="btn btn-sm btn-outline-primary mt-3" to="/lecturer/notifications">Open notifications</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link className="btn btn-primary" to="/lecturer/upload-material">Upload material</Link>
            <Link className="btn btn-outline-primary" to="/lecturer/groups">Manage groups</Link>
            <Link className="btn btn-outline-primary" to="/lecturer/messages">Messages</Link>
          </div>
        </>
      )}
    </section>
  )
}

export default LecturerDashboard
