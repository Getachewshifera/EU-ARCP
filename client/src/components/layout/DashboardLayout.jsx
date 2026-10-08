// Purpose: Common dashboard page frame containing navigation and page content.
import { Link, NavLink, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

const roleNavigation = {
  student: [
    ['Overview', '/student', true],
    ['Browse materials', '/student/materials'],
    ['My materials', '/student/my-materials'],
    ['Upload material', '/student/upload'],
    ['Study groups', '/student/groups'],
    ['Messages', '/student/messages'],
    ['Notifications', '/student/notifications'],
    ['Profile', '/student/profile'],
    ['Change password', '/student/password'],
  ],
  lecturer: [
    ['Overview', '/lecturer', true],
    ['Browse materials', '/lecturer/materials'],
    ['My materials', '/lecturer/my-materials'],
    ['Upload material', '/lecturer/upload'],
    ['My groups', '/lecturer/groups'],
    ['Messages', '/lecturer/messages'],
    ['Notifications', '/lecturer/notifications'],
    ['Profile', '/lecturer/profile'],
    ['Change password', '/lecturer/password'],
  ],
}

function DashboardLayout({ role }) {
  const { user } = useAuth()
  const links = roleNavigation[role] ?? []

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to={`/${role}`}>EU-ARCP <span>{role}</span></Link>
        <nav aria-label={`${role} navigation`} className="nav flex-column dashboard-nav">
          {links.map(([label, to, end]) => (
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end={end} key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-user">
          <strong>{user?.name || user?.email || 'Account'}</strong>
          <span className="text-secondary small text-capitalize">{role}</span>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <span className="fw-semibold">Academic Resource Collaboration Platform</span>
          <span className="text-secondary small">{user?.university?.name || user?.university || ''}</span>
        </header>
        <div className="dashboard-content"><Outlet /></div>
      </main>
    </div>
  )
}

export default DashboardLayout
