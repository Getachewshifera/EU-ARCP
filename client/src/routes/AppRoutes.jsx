// Purpose: Declares the client URL routes and their page components.
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <main className="container py-5">
      <div className="mx-auto text-center" style={{ maxWidth: '48rem' }}>
        <p className="text-uppercase text-primary fw-semibold mb-2">EU-ARCP</p>
        <h1 className="display-5 fw-bold">Academic Resource Collaboration Platform</h1>
        <p className="lead text-secondary mt-3">
          The React, Vite, Express, and Bootstrap project scaffold is ready.
        </p>
        <Link className="btn btn-primary mt-2" to="/login">
          Get started
        </Link>
      </div>
    </main>
  )
}

function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </main>
  )
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
