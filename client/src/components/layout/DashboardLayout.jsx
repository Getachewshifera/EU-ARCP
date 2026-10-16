// Purpose: Common dashboard page frame containing navigation and page content.
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import userService from '../../services/userService.js'
import { getAvatarUrl } from '../../services/studentService.js'
import ThemeToggle from '../common/ThemeToggle.jsx'

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
  const location = useLocation()
  const [displayName, setDisplayName] = useState(() => getDisplayName(user))
  const [universityName, setUniversityName] = useState(
    user?.university && typeof user.university === 'object' ? user.university.name || '' : '',
  )
  const [universityLoadError, setUniversityLoadError] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(() => getAvatarUrl(user?.profilePhoto))
  const links = roleNavigation[role] ?? []

  useEffect(() => {
    let active = true
    userService.getCurrentUser()
      .then((response) => {
        const account = response.data?.user ?? response.data?.data?.user
        const university = account?.university
        if (active && account) {
          setDisplayName(getDisplayName(account))
          setAvatarUrl(getAvatarUrl(account.profilePhoto))
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
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bs-primary,#0d6efd)', flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {displayName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'}
                </div>
            }
            <div style={{ overflow: 'hidden' }}>
              <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</strong>
              <span className="text-secondary small text-capitalize">{role}</span>
            </div>
          </div>
          <button className="btn btn-outline-secondary btn-sm mt-1" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="fw-semibold d-block">Academic Resource Collaboration Platform</span>
            <span className="text-secondary small">{universityName || (universityLoadError ? 'University unavailable' : '')}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <ThemeToggle size="sm" />
          </div>
        </header>
        <div className="dashboard-content">
          <div key={location.pathname} className="page-transition-wrapper">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
