// Purpose: Shared page footer.
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="border-top bg-white py-4 mt-auto">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span className="small text-secondary">© {currentYear} EU-ARCP · Academic Resource Collaboration Platform</span>
        <Link className="small text-decoration-none" to="/materials">Browse resources</Link>
      </div>
    </footer>
  )
}

export default Footer
