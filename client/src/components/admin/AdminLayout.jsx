import { NavLink, Outlet } from 'react-router-dom'

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
  { label: 'Activity logs', to: '/admin/activity' },
  { label: 'System settings', to: '/admin/settings' },
]

function AdminLayout() {
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
          <NavLink className="nav-link" to="/">Back to home</NavLink>
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
