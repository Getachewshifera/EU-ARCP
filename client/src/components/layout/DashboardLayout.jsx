// Purpose: Common dashboard page frame containing navigation and page content.
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import userService from '../../services/userService.js'

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

function getDisplayName(account) {
  const firstAndMiddleName = [account?.firstName, account?.middleName]
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => name.trim())
    .join(' ')

  return firstAndMiddleName || account?.name || account?.email || 'Account'
}

function DashboardLayout({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(() => getDisplayName(user))
  const [universityName, setUniversityName] = useState(
    user?.university && typeof user.university === 'object' ? user.university.name || '' : '',
  )
  const [universityLoadError, setUniversityLoadError] = useState(false)
  const links = roleNavigation[role] ?? []

  useEffect(() => {
    let active = true
    userService.getCurrentUser()
      .then((response) => {
        const account = response.data?.user ?? response.data?.data?.user
        const university = account?.university
        if (active && account) {
          setDisplayName(getDisplayName(account))
        }
        if (active && university && typeof university === 'object') {
          setUniversityName(university.name || '')
        } else if (active) {
          setUniversityLoadError(true)
        }
      })
      .catch(() => {
        if (active) setUniversityLoadError(true)
      })
    return () => {
      active = false
    }
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

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
          <strong>{displayName}</strong>
          <span className="text-secondary small text-capitalize">{role}</span>
          <button className="btn btn-outline-secondary btn-sm mt-2" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <span className="fw-semibold">Academic Resource Collaboration Platform</span>
          <span className="text-secondary small">{universityName || (universityLoadError ? 'University unavailable' : '')}</span>
        </header>
        <div className="dashboard-content"><Outlet /></div>
      </main>
    </div>
  )
}

export default DashboardLayout
