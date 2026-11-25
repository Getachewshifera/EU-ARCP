// Purpose: Shared page footer.
import { Link } from 'react-router-dom'
import useLanguage from '../../hooks/useLanguage.js'

const currentYear = new Date().getFullYear()

function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-top bg-body py-4 mt-auto">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span className="small text-secondary">© {currentYear} EU-ARCP · {t('Academic Resource Collaboration Platform')}</span>
        <Link className="small text-decoration-none" to="/materials">{t('Browse resources')}</Link>
      </div>
    </footer>
  )
}

export default Footer
