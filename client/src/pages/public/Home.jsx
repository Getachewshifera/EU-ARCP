// Purpose: Public landing page for EUARCP (Ethiopian University Academic Resource and Communication Platform).
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar.jsx'
import Footer from '../../components/layout/Footer.jsx'
import useAuth from '../../hooks/useAuth.js'

const heroPillars = [
  {
    title: 'Academic Resources',
    desc: 'Find notes, assignments, and research materials.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Communication',
    desc: 'Connect through group and private chats.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Academic Community',
    desc: 'Share knowledge across universities.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

const keyFeatures = [
  {
    badge: 'Contribute',
    title: 'Upload Materials',
    desc: 'Easily upload lecture notes, lab sheets, previous exams, and assignments to share with fellow students and peers.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    ),
  },
  {
    badge: 'Discover',
    title: 'Search & Filter',
    desc: 'Quickly find resources filtered by university, academic department, course title, and document category in seconds.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
      </svg>
    ),
  },
  {
    badge: 'Access',
    title: 'Instant Download',
    desc: 'Access verified study documents directly online or download them to your device for offline examination preparation.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    ),
  },
  {
    badge: 'Collaborate',
    title: 'Group & Private Chat',
    desc: 'Engage with classmates and lecturers in subject study groups or message mentors one-on-one for academic guidance.',
    icon: (
      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
]

const steps = [
  {
    step: '01',
    title: 'Register',
    desc: 'Create your account by selecting your Ethiopian university, faculty, and academic role (student or lecturer).',
  },
  {
    step: '02',
    title: 'Activate Account',
    desc: 'Verify your email or credentials to activate your verified account and access your personal dashboard.',
  },
  {
    step: '03',
    title: 'Explore & Share',
    desc: 'Search our centralized archive of course resources or upload your own notes to help other students.',
  },
  {
    step: '04',
    title: 'Learn & Collaborate',
    desc: 'Join course study groups, exchange direct messages with peers and instructors, and build your future together.',
  },
]

function Home() {
  const { user, isAuthenticated } = useAuth()

  if (isAuthenticated) {
    const role = ['admin', 'lecturer', 'student'].includes(user?.role) ? user.role : 'student'
    return <Navigate to={`/${role}`} replace />
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        {/* ==========================================================================
            1. HERO SECTION
            ========================================================================== */}
        <section className="home-hero border-bottom">
          <div className="container py-5">
            <div className="row align-items-center g-5 py-lg-4">
              <div className="col-lg-6">
                <span className="badge rounded-pill text-bg-primary-subtle text-primary px-3 py-2 fw-semibold mb-3">
                  Welcome to EUARCP
                </span>
                <h1 className="display-4 fw-bold lh-sm text-balance">
                  Your Knowledge.<br />
                  <span className="text-primary">Your University.</span><br />
                  Your Future.
                </h1>
                <p className="lead text-secondary mt-3 mb-4">
                  Connect with students and lecturers, discover academic materials, and share knowledge across Ethiopian universities.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Link className="btn btn-primary btn-lg px-4 shadow-sm" to="/register">
                    Get Started
                  </Link>
                  <Link className="btn btn-outline-primary btn-lg px-4" to="/materials">
                    Explore Materials
                  </Link>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="home-hero-image-wrapper position-relative rounded-4 overflow-hidden shadow-lg border">
                  <img
                    alt="Ethiopian university students studying together in a modern library"
                    className="img-fluid w-100 object-fit-cover"
                    src="/library-students.png"
                    style={{ minHeight: '340px', maxHeight: '420px' }}
                  />
                  <div className="home-hero-image-overlay position-absolute bottom-0 start-0 end-0 p-3 bg-dark bg-opacity-75 text-white">
                    <p className="small mb-0 fw-medium">
                      🎓 Ethiopian University Academic Resource & Communication Platform
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Quick Hero Pillars */}
            <div className="row g-3 pt-4 pt-lg-5">
              {heroPillars.map((pillar) => (
                <div className="col-md-4" key={pillar.title}>
                  <div className="card h-100 border-0 shadow-sm p-3 home-pillar-card">
                    <div className="card-body d-flex align-items-center gap-3 p-2">
                      <div className="home-feature-icon text-primary bg-primary-subtle p-3 rounded-3 flex-shrink-0">
                        {pillar.icon}
                      </div>
                      <div>
                        <h2 className="h6 fw-bold mb-1">{pillar.title}</h2>
                        <p className="small text-secondary mb-0">{pillar.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            2. ABOUT EUARCP SECTION
            ========================================================================== */}
        <section className="py-5 bg-body-tertiary" id="about">
          <div className="container py-lg-4">
            <div className="row align-items-center g-5">
              <div className="col-lg-7">
                <span className="text-primary small text-uppercase fw-bold">About the Platform</span>
                <h2 className="display-6 fw-bold mt-2 mb-3">
                  Connecting Ethiopian Universities Through Knowledge & Collaboration
                </h2>
                <div className="vstack gap-3 text-secondary">
                  <p className="mb-0">
                    <strong>EUARCP (Ethiopian University Academic Resource and Communication Platform)</strong> is a centralized digital platform designed to connect Ethiopian university students and lecturers through academic resource sharing and communication.
                  </p>
                  <p className="mb-0">
                    Our platform makes it easier to upload, discover, access, and download educational materials from different academic fields. Whether you are looking for lecture notes, assignments, tutorials, research papers, or study resources, EUARCP helps you find the materials you need to support your academic journey.
                  </p>
                  <p className="mb-0">
                    Beyond resource sharing, EUARCP provides a collaborative environment where students and lecturers can communicate through group discussions and private messaging, exchange knowledge, and learn from one another.
                  </p>
                  <p className="mb-0">
                    Our mission is to make academic resources more accessible, strengthen collaboration among Ethiopian universities, and support a connected learning community.
                  </p>
                </div>
                <div className="mt-4 p-3 rounded-3 border-start border-4 border-primary bg-body shadow-sm">
                  <p className="h5 fw-bold text-primary mb-1">Learn Together. Share Knowledge. Build the Future.</p>
                  <small className="text-secondary">Empowering higher education across Ethiopia through accessible digital collaboration.</small>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm p-4 home-about-highlight-card">
                  <div className="card-body p-2">
                    <h3 className="h5 fw-bold mb-4">Platform Highlights</h3>
                    <div className="vstack gap-4">
                      <div className="d-flex align-items-start gap-3">
                        <span className="badge rounded-circle text-bg-primary p-2">✓</span>
                        <div>
                          <strong className="d-block text-body">Centralized Resource Hub</strong>
                          <span className="small text-secondary">Lecture notes, past papers, lab manuals, and tutorials in one place.</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3">
                        <span className="badge rounded-circle text-bg-primary p-2">✓</span>
                        <div>
                          <strong className="d-block text-body">Cross-University Interaction</strong>
                          <span className="small text-secondary">Connect with learners and faculty from institutions nationwide.</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3">
                        <span className="badge rounded-circle text-bg-primary p-2">✓</span>
                        <div>
                          <strong className="d-block text-body">Real-Time Messaging</strong>
                          <span className="small text-secondary">Department study groups and private mentor messaging for guidance.</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3">
                        <span className="badge rounded-circle text-bg-primary p-2">✓</span>
                        <div>
                          <strong className="d-block text-body">Verified Profiles</strong>
                          <span className="small text-secondary">Role-based accounts for students, lecturers, and department heads.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            3. KEY FEATURES SECTION
            ========================================================================== */}
        <section className="py-5 border-bottom" id="features">
          <div className="container py-lg-4">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: '42rem' }}>
              <span className="text-primary small text-uppercase fw-bold">Key Features</span>
              <h2 className="display-6 fw-bold mt-2">Tools Designed for Your Academic Success</h2>
              <p className="text-secondary lead fs-6">
                Everything you need to discover learning materials, collaborate on coursework, and communicate easily.
              </p>
            </div>
            <div className="row g-4">
              {keyFeatures.map((feature) => (
                <div className="col-md-6 col-lg-3" key={feature.title}>
                  <div className="card h-100 border-0 shadow-sm p-3 home-feature-card">
                    <div className="card-body p-2 d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="home-feature-icon text-primary bg-primary-subtle p-3 rounded-3">
                          {feature.icon}
                        </div>
                        <span className="badge rounded-pill text-bg-secondary-subtle text-secondary small">
                          {feature.badge}
                        </span>
                      </div>
                      <h3 className="h5 fw-bold mb-2">{feature.title}</h3>
                      <p className="text-secondary small mb-0 flex-grow-1">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            4. HOW IT WORKS SECTION
            ========================================================================== */}
        <section className="py-5 bg-body-tertiary" id="how-it-works">
          <div className="container py-lg-4">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: '42rem' }}>
              <span className="text-primary small text-uppercase fw-bold">How It Works</span>
              <h2 className="display-6 fw-bold mt-2">Get Started in 4 Simple Steps</h2>
              <p className="text-secondary lead fs-6">
                Joining the Ethiopian University Academic Resource & Communication Platform is quick and easy.
              </p>
            </div>
            <div className="row g-4">
              {steps.map((item) => (
                <div className="col-md-6 col-lg-3" key={item.step}>
                  <div className="card h-100 border-0 shadow-sm p-3 position-relative home-step-card">
                    <div className="card-body p-2">
                      <span className="display-5 fw-bold text-primary opacity-25 d-block mb-2">
                        {item.step}
                      </span>
                      <h3 className="h5 fw-bold mb-2">{item.title}</h3>
                      <p className="text-secondary small mb-0">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            5. CALL TO ACTION (CTA)
            ========================================================================== */}
        <section className="py-5">
          <div className="container py-lg-4">
            <div className="home-cta-card p-5 text-center text-white rounded-4 shadow-lg position-relative overflow-hidden">
              <div className="position-relative mx-auto" style={{ maxWidth: '44rem', zIndex: 1 }}>
                <span className="badge rounded-pill bg-white text-primary px-3 py-2 fw-semibold mb-3">
                  Start Your Journey
                </span>
                <h2 className="display-5 fw-bold mb-3">
                  Join the EUARCP Community Today!
                </h2>
                <p className="lead text-white-50 mb-4 fs-5">
                  Learn Together. Share Knowledge. Build the Future. Connect with thousands of students and lecturers across Ethiopian universities.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Link className="btn btn-light btn-lg px-4 text-primary fw-semibold" to="/register">
                    Create Free Account
                  </Link>
                  <Link className="btn btn-outline-light btn-lg px-4" to="/login">
                    Sign In to Workspace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default Home
