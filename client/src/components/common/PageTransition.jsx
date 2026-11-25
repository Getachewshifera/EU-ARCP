// Purpose: Page transition wrapper and route indicator with "Megareja Open" (መጋረጃ መክፈት - Curtain Opening) transition.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function MegarejaCurtain() {
  return (
    <div aria-hidden="true" className="megareja-overlay">
      <div className="megareja-panel megareja-panel-left">
        <div className="megareja-folds" />
        <div className="megareja-hem" />
      </div>
      <div className="megareja-panel megareja-panel-right">
        <div className="megareja-folds" />
        <div className="megareja-hem" />
      </div>
    </div>
  )
}

export function RouteProgressBar() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '')
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(targetId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 120)
      return () => {
        clearTimeout(scrollTimer)
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.pathname, location.search, location.hash])

  return (
    <>
      <div aria-hidden="true" className="route-progress-container" key={location.key}>
        <div className="route-progress-bar" />
      </div>
      <MegarejaCurtain key={location.key} />
    </>
  )
}

function PageTransition({ children, className = '' }) {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      className={`page-transition-wrapper ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default PageTransition
