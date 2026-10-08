// Purpose: Shared top navigation bar.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">EU-ARCP</Link>
        <button
          aria-controls="site-navigation"
          aria-expanded={expanded}
          aria-label="Toggle navigation"
          className="navbar-toggler"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`navbar-collapse${expanded ? ' d-block' : ' d-none'} d-lg-flex`} id="site-navigation">
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <Link className="nav-link" to="/materials">Resources</Link>
            {isAuthenticated ? (
              <>
                <Link className="nav-link" to={`/${user?.role || 'student'}`}>Dashboard</Link>
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout} type="button">Sign out</button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login">Sign in</Link>
                <Link className="btn btn-primary btn-sm" to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
