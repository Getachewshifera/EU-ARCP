// Purpose: Restricts routes to users with allowed roles.
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

function RoleRoute({ allowedRoles = [], children }) {
  const { user } = useAuth()
  const role = String(user?.role ?? '').toLowerCase()

  if (!allowedRoles.map((item) => item.toLowerCase()).includes(role)) {
    return <Navigate replace to="/" />
  }

  return children
}

export default RoleRoute
