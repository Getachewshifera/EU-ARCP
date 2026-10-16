import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

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
  { label: 'Contact messages', to: '/admin/contact-messages' },
  { label: 'Activity logs', to: '/admin/activity' },
  { label: 'System settings', to: '/admin/settings' },
]

function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

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
        <nav aria-label="Admin navigation" className="nav flex-column admin-nav">
          {navigation.map(({ label, to, end }) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={end}
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-outline-secondary btn-sm w-100 mt-2" type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <span className="text-secondary">Academic Resource Collaboration Platform</span>
          <span className="badge text-bg-primary">Admin</span>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
