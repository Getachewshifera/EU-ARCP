import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import ThemeToggle from '../common/ThemeToggle.jsx'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleSectionNavigation(e, targetId) {
    if (location.pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      window.history.replaceState(null, '', `/#${targetId}`)
      setExpanded(false)
    } else {
      setExpanded(false)
    }
  }

  function handleHomeClick(e) {
    if (location.pathname === '/' && !location.hash) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setExpanded(false)
    } else {
      setExpanded(false)
    }
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom sticky-top site-navbar">
      <div className="container">
        <Link className="navbar-brand d-inline-flex align-items-center gap-2 fw-bold text-primary" to="/">
          <img
            alt="EU-ARCP Logo"
            className="navbar-logo"
            src="/image.png"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
          <span>EU-ARCP</span>
        </Link>
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
          <div className="navbar-nav ms-auto align-items-lg-center gap-2">
            <Link className="nav-link" onClick={handleHomeClick} to="/">Home</Link>
            <Link className="nav-link" onClick={(e) => handleSectionNavigation(e, 'about')} to="/#about">About</Link>
            <Link className="nav-link" onClick={(e) => handleSectionNavigation(e, 'features')} to="/#features">Features</Link>
            <Link className="nav-link" onClick={(e) => handleSectionNavigation(e, 'how-it-works')} to="/#how-it-works">How It Works</Link>
            <Link className="nav-link" onClick={() => setExpanded(false)} to="/contact">Contact</Link>
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
            <ThemeToggle className="ms-lg-2" size="sm" />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
