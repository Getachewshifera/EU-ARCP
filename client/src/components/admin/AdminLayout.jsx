import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useLanguage from '../../hooks/useLanguage.js'
import LanguageToggle from '../common/LanguageToggle.jsx'
import ThemeToggle from '../common/ThemeToggle.jsx'
import PostFeed from '../posts/PostFeed.jsx'

const navigation = [
  { label: 'Overview', to: '/admin', end: true },
  { label: 'Users', to: '/admin/users' },
  { label: 'Registration requests', to: '/admin/registrations' },
  { label: 'Universities', to: '/admin/universities' },
  { label: 'Academic structure', to: '/admin/academic' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Materials', to: '/admin/materials' },
  { label: 'Groups', to: '/admin/groups' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Posts', to: '/admin/posts' },
  { label: 'Contact messages', to: '/admin/contact-messages' },
  { label: 'Activity logs', to: '/admin/activity' },
  { label: 'System settings', to: '/admin/settings' },
]

function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">EU</span>
          <span>
            <strong>EU-ARCP</strong>
            <small className="d-block text-secondary">Administration</small>
          </span>
        </div>
        <nav aria-label={t('Admin navigation')} className="nav flex-column admin-nav">
          {navigation.map(({ label, to, end }) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={end}
              key={to}
              to={to}
            >
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-outline-secondary btn-sm w-100 mt-2" type="button" onClick={handleLogout}>{t('Sign out')}</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <span className="text-secondary">{t('Academic Resource Collaboration Platform')}</span>
          <div className="d-flex align-items-center gap-2">
            <LanguageToggle />
            <ThemeToggle size="sm" />
            <span className="badge text-bg-primary">{t('Admin')}</span>
          </div>
        </header>
        <div className="admin-content">
          <PostFeed compact />
          <div key={location.pathname} className="page-transition-wrapper">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
