import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import useTheme from '../hooks/useTheme.js'
import useLanguage from '../hooks/useLanguage.js'
import LanguageToggle from '../components/common/LanguageToggle.jsx'

function MaintenanceNotice({ message }) {
  const { t } = useLanguage()

  return (
    <main className="maintenance-screen">
      <div className="maintenance-card">
        <span className="maintenance-icon" aria-hidden="true">!</span>
        <p className="maintenance-eyebrow">{t('EU-ARCP service update')}</p>
        <h1>{t('We’ll be back soon')}</h1>
        <p className="maintenance-message">{message}</p>
        <p className="maintenance-note">{t('Your account and shared materials are safe. Please check back shortly.')}</p>
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
          <LanguageToggle />
          <Link className="btn btn-outline-primary" to="/login">{t('Administrator sign in')}</Link>
        </div>
      </div>
    </main>
  )
}

function MaintenanceGate({ children }) {
  const { user } = useAuth()
  const { maintenance, maintenanceLoading, maintenanceError } = useTheme()
  const { t } = useLanguage()
  const location = useLocation()

  if (maintenanceLoading) {
    return <main className="container py-5 text-secondary" role="status">{t('Checking platform availability…')}</main>
  }

  if (maintenance.enabled && user?.role !== 'admin' && location.pathname !== '/login') {
    return <MaintenanceNotice message={maintenance.message} />
  }

  return (
    <>
      {maintenanceError && (
        <div className="container pt-3">
          <div className="alert alert-warning" role="status">
            {t('Maintenance status could not be verified. Some platform services may be unavailable.')}
          </div>
        </div>
      )}
      {children}
    </>
  )
}

export default MaintenanceGate
