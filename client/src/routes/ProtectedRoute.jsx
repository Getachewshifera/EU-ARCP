// Purpose: Restricts routes to authenticated users.
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="container py-5" role="status">Checking your session…</div>
  if (!isAuthenticated) return <Navigate replace to="/login" state={{ from: location }} />
  return children
}

export default ProtectedRoute
