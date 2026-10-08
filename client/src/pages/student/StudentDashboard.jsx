import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asEntity, asList, getErrorMessage, getRecordId, getRecordTitle, displayPerson } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/portal/student/StudentUi.jsx'

const shortcuts = [
  ['Browse materials', '/student/materials', 'Find course resources shared with students.'],
  ['My materials', '/student/my-materials', 'Review materials you have submitted.'],
  ['Study groups', '/student/groups', 'Explore groups and join a study community.'],
  ['Notifications', '/student/notifications', 'Keep up with account and learning updates.'],
]

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      const response = await studentService.getDashboard()
      setDashboard(asEntity(response, ['dashboard', 'summary']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])
  const retryDashboard = () => {
    setLoading(true)
    loadDashboard()
  }

  const data = dashboard || {}
  const student = data.student || data.profile || data.user || {}
  const counts = data.statistics || data.stats || data.counts || {}
  const metrics = [
    ['Materials', counts.materials ?? data.materialCount],
    ['My uploads', counts.myMaterials ?? counts.uploads ?? data.myMaterialCount],
    ['Groups', counts.groups ?? data.groupCount],
    ['Unread notifications', counts.unreadNotifications ?? data.unreadNotificationCount],
  ].filter(([, value]) => value !== undefined && value !== null)
  const recentMaterials = asList(data.recentMaterials ?? data.materials, ['materials'])
  const recentGroups = asList(data.recentGroups ?? data.groups, ['groups'])

  return (
    <main className="container py-4">
      <PageHeader
        title="Student dashboard"
        description={displayPerson(student) ? `Welcome, ${displayPerson(student)}.` : 'Your learning hub for shared resources and study groups.'}
        actions={<Link className="btn btn-outline-primary" to="/student/profile">View profile</Link>}
      />
      {loading ? <LoadingState label="Loading your dashboard…" /> : error ? <ErrorState message={error} onRetry={retryDashboard} /> : (
        <>
          {metrics.length > 0 && (
            <section className="row g-3 mb-4" aria-label="Account overview">
              {metrics.map(([label, value]) => (
                <div className="col-6 col-lg-3" key={label}>
                  <div className="card h-100 shadow-sm"><div className="card-body">
                    <p className="text-body-secondary mb-1">{label}</p>
                    <p className="h3 mb-0">{value}</p>
                  </div></div>
                </div>
              ))}
            </section>
          )}
          <section className="mb-4">
            <h2 className="h5 mb-3">Quick access</h2>
            <div className="row g-3">
              {shortcuts.map(([title, to, description]) => (
                <div className="col-12 col-sm-6 col-xl-3" key={title}>
                  <Link to={to} className="card h-100 shadow-sm text-decoration-none text-reset">
                    <div className="card-body"><h3 className="h6">{title}</h3><p className="text-body-secondary mb-0">{description}</p></div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
          {data && Object.keys(data).length === 0 && (
            <div className="alert alert-info">Your dashboard is ready. Explore the sections above to get started.</div>
          )}
          {(data.recentMaterials || data.materials) && (
            <section className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0">Recent materials</h2><Link to="/student/materials">Browse all</Link>
              </div>
              {recentMaterials.length ? <div className="list-group">
                {recentMaterials.slice(0, 5).map((item) => (
                  getRecordId(item)
                    ? <Link key={getRecordId(item)} to={`/student/materials/${encodeURIComponent(getRecordId(item))}`} className="list-group-item list-group-item-action">{getRecordTitle(item)}</Link>
                    : <div key={getRecordTitle(item)} className="list-group-item">{getRecordTitle(item)}</div>
                ))}
              </div> : <EmptyState title="No recent materials" />}
            </section>
          )}
          {(data.recentGroups || data.groups) && (
            <section>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0">Your groups</h2><Link to="/student/groups">Explore groups</Link>
              </div>
              {recentGroups.length ? <div className="list-group">
                {recentGroups.slice(0, 5).map((group) => (
                  getRecordId(group)
                    ? <Link key={getRecordId(group)} to={`/student/groups/${encodeURIComponent(getRecordId(group))}`} className="list-group-item list-group-item-action">{getRecordTitle(group)}</Link>
                    : <div key={getRecordTitle(group)} className="list-group-item">{getRecordTitle(group)}</div>
                ))}
              </div> : <EmptyState title="No groups to show" description="Browse groups to find a study community." />}
            </section>
          )}
        </>
      )}
    </main>
  )
}
