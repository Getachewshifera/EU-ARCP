// Purpose: Shared side navigation for signed-in areas.
import { NavLink } from 'react-router-dom'

const navigation = {
  admin: [
    ['Overview', '/admin', true], ['Users', '/admin/users'], ['Registrations', '/admin/registrations'],
    ['Universities', '/admin/universities'], ['Academic structure', '/admin/academic'],
    ['Categories', '/admin/categories'], ['Materials', '/admin/materials'], ['Groups', '/admin/groups'],
    ['Reports', '/admin/reports'], ['Activity logs', '/admin/activity'], ['Settings', '/admin/settings'],
  ],
  student: [
    ['Overview', '/student', true], ['Materials', '/student/materials'], ['My materials', '/student/my-materials'],
    ['Upload material', '/student/upload'], ['Groups', '/student/groups'], ['Messages', '/student/messages'],
    ['Notifications', '/student/notifications'], ['Profile', '/student/profile'],
  ],
  lecturer: [
    ['Overview', '/lecturer', true], ['Materials', '/lecturer/materials'], ['My materials', '/lecturer/my-materials'],
    ['Upload material', '/lecturer/upload'], ['Groups', '/lecturer/groups'], ['Messages', '/lecturer/messages'],
    ['Notifications', '/lecturer/notifications'], ['Profile', '/lecturer/profile'],
  ],
}

function Sidebar({ role = 'student', className = '' }) {
  const links = navigation[role] || []
  return (
    <nav aria-label={`${role} navigation`} className={`nav flex-column ${className}`}>
      {links.map(([label, to, end]) => (
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end={end} key={to} to={to}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar
