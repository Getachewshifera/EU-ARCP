import { Link } from 'react-router-dom'
import Navbar from '../layout/Navbar.jsx'
import useLanguage from '../../hooks/useLanguage.js'

function AuthPage({ title, description, children }) {
  const { t } = useLanguage()

  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '34rem' }}>
          <div className="card-body p-4 p-md-5">
            <Link className="small text-decoration-none" to="/">{t('← Back to home')}</Link>
            <h1 className="h3 mt-3 mb-2">{t(title)}</h1>
            {description && <p className="text-secondary mb-4">{t(description)}</p>}
            {children}
          </div>
        </div>
      </main>
    </>
  )
}

export default AuthPage
