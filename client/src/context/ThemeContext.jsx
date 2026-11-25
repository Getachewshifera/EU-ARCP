// Purpose: Theme management context for light and dark modes with persistence and system sync.
import { useCallback, useEffect, useMemo, useState } from 'react'
import ThemeContext from './themeContext.js'
import api from '../services/api.js'

const DEFAULT_APPEARANCE = {
  primaryColor: '#2563eb',
  backgroundColor: '#f4f7fb',
}

const DEFAULT_MAINTENANCE = {
  enabled: false,
  message: 'The platform is temporarily unavailable while scheduled maintenance is in progress. Please try again later.',
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // Ignore localStorage errors
  }

  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function applyThemeToDOM(theme, primaryColor) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-bs-theme', theme)
  root.setAttribute('data-theme', theme)

  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : primaryColor)
  }
}

function applyAppearanceToDOM(appearance) {
  if (typeof document === 'undefined') return
  const { primaryColor, backgroundColor } = appearance
  const primaryRgb = primaryColor.match(/[0-9a-f]{2}/gi).map((part) => Number.parseInt(part, 16)).join(', ')
  const root = document.documentElement
  const backgroundRgb = appearance.backgroundColor.match(/[0-9a-f]{2}/gi).map((part) => Number.parseInt(part, 16)).join(', ')
  root.style.setProperty('--site-primary-color', primaryColor)
  root.style.setProperty('--site-primary-rgb', primaryRgb)
  root.style.setProperty('--site-background-color', backgroundColor)
  root.style.setProperty('--site-background-rgb', backgroundRgb)
  root.style.setProperty('--bs-primary', primaryColor)
  root.style.setProperty('--bs-primary-rgb', primaryRgb)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [appearance, setAppearanceState] = useState(DEFAULT_APPEARANCE)
  const [appearanceError, setAppearanceError] = useState('')
  const [maintenance, setMaintenanceState] = useState(DEFAULT_MAINTENANCE)
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const [maintenanceError, setMaintenanceError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/site/appearance')
      .then((response) => {
        const nextAppearance = response.data?.appearance
        if (active && nextAppearance
          && /^#[0-9a-f]{6}$/i.test(nextAppearance.primaryColor)
          && /^#[0-9a-f]{6}$/i.test(nextAppearance.backgroundColor)) {
          setAppearanceState(nextAppearance)
        }
      })
      .catch((error) => {
        if (active) {
          setAppearanceError(error.response?.data?.message || error.message || 'Unable to load site appearance.')
        }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    api.get('/site/maintenance')
      .then((response) => {
        const nextMaintenance = response.data?.maintenance
        if (active && typeof nextMaintenance?.enabled === 'boolean' && typeof nextMaintenance.message === 'string') {
          setMaintenanceState(nextMaintenance)
        }
      })
      .catch((error) => {
        if (active) {
          setMaintenanceError(error.response?.data?.message || error.message || 'Unable to load maintenance status.')
        }
      })
      .finally(() => {
        if (active) setMaintenanceLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme, appearance.primaryColor)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Ignore localStorage write error
    }
  }, [theme, appearance.primaryColor])

  useEffect(() => {
    applyAppearanceToDOM(appearance)
  }, [appearance])

  const updateAppearance = useCallback(async (nextAppearance) => {
    const response = await api.put('/site/appearance', nextAppearance)
    setAppearanceState(response.data.appearance)
    setAppearanceError('')
    return response.data.appearance
  }, [])

  const updateMaintenance = useCallback(async (nextMaintenance) => {
    const response = await api.put('/site/maintenance', nextMaintenance)
    setMaintenanceState(response.data.maintenance)
    setMaintenanceError('')
    return response.data.maintenance
  }, [])

  // Listen for system theme changes if user hasn't set an explicit preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const saved = localStorage.getItem('theme')
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
    appearance,
    appearanceError,
    updateAppearance,
    maintenance,
    maintenanceLoading,
    maintenanceError,
    updateMaintenance,
  }), [
    theme,
    setTheme,
    toggleTheme,
    appearance,
    appearanceError,
    updateAppearance,
    maintenance,
    maintenanceLoading,
    maintenanceError,
    updateMaintenance,
  ])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
