// Purpose: Public landing page.
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar.jsx'

const features = [
  ['Find resources', 'Search learning materials shared by your academic community.'],
  ['Learn together', 'Create or join study groups and share knowledge.'],
  ['Share your work', 'Contribute useful materials to help other students.'],
]

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="home-hero">
          <div className="container py-5">
            <div className="row align-items-center g-5 py-lg-5">
              <div className="col-lg-7">
                <span className="badge rounded-pill text-bg-primary-subtle text-primary mb-3">Built for academic communities</span>
                <h1 className="display-4 fw-bold lh-sm">Learn together.<br /><span className="text-primary">Share knowledge.</span></h1>
                <p className="lead text-secondary mt-3">
                  Discover learning materials, connect through study groups, and collaborate with students and lecturers.
                </p>
                <div className="d-flex flex-wrap gap-2 mt-4">
                  <Link className="btn btn-primary btn-lg" to="/register">Join the community</Link>
                  <Link className="btn btn-outline-primary btn-lg" to="/login">Sign in</Link>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="home-highlight card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <p className="small text-uppercase fw-semibold text-primary">EU-ARCP</p>
                    <h2 className="h3">Your academic resources, connected.</h2>
                    <p className="text-secondary mb-0">A shared space for course materials, group learning, and collaboration.</p>
                    <div className="home-highlight-decoration" aria-hidden="true">E</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="container py-5">
          <div className="text-center mb-4">
            <h2 className="h2">A better way to collaborate</h2>
            <p className="text-secondary">Everything you need to find and share academic knowledge.</p>
          </div>
          <div className="row g-3">
            {features.map(([title, text], index) => (
              <div className="col-md-4" key={title}>
                <article className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <span className="feature-number">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="h5 mt-3">{title}</h3>
                    <p className="text-secondary mb-0">{text}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default Home
