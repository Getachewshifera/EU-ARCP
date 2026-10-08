import { Link } from 'react-router-dom'
import Navbar from '../layout/Navbar.jsx'

function AuthPage({ title, description, children }) {
  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '34rem' }}>
          <div className="card-body p-4 p-md-5">
            <Link className="small text-decoration-none" to="/">← Back to home</Link>
            <h1 className="h3 mt-3 mb-2">{title}</h1>
            {description && <p className="text-secondary mb-4">{description}</p>}
            {children}
          </div>
        </div>
      </main>
    </>
  )
}

export default AuthPage
