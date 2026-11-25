import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import useTheme from '../hooks/useTheme.js'

function MaintenanceNotice({ message }) {
  return (
    <main className="maintenance-screen">
      <div className="maintenance-card">
        <span className="maintenance-icon" aria-hidden="true">!</span>
        <p className="maintenance-eyebrow">EU-ARCP service update</p>
        <h1>We’ll be back soon</h1>
        <p className="maintenance-message">{message}</p>
        <p className="maintenance-note">Your account and shared materials are safe. Please check back shortly.</p>
        <Link className="btn btn-outline-primary mt-2" to="/login">Administrator sign in</Link>
      </div>
    </main>
  )
}

function MaintenanceGate({ children }) {
  const { user } = useAuth()
  const { maintenance, maintenanceLoading, maintenanceError } = useTheme()
  const location = useLocation()

  if (maintenanceLoading) {
    return <main className="container py-5 text-secondary" role="status">Checking platform availability…</main>
  }

  if (maintenance.enabled && user?.role !== 'admin' && location.pathname !== '/login') {
    return <MaintenanceNotice message={maintenance.message} />
  }

  return (
    <>
      {maintenanceError && (
        <div className="container pt-3">
          <div className="alert alert-warning" role="status">
            Maintenance status could not be verified. Some platform services may be unavailable.
          </div>
        </div>
      )}
      {children}
    </>
  )
}

export default MaintenanceGate
