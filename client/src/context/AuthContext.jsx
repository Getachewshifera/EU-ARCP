// Purpose: Shared client authentication state and actions.
import { useCallback, useMemo, useState } from 'react'
import AuthContext from './authContext.js'
import authService from '../services/authService.js'

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

function getAuthPayload(response) {
  const payload = response?.data?.data ?? response?.data ?? {}
  return {
    token: payload.token ?? payload.accessToken,
    user: payload.user ?? payload.account,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials)
    const { token, user: account } = getAuthPayload(response)
    if (!token || !account) {
      throw new Error('The login response did not include an access token and user.')
    }

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(account))
    setUser(account)
    return account
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    loading: false,
    isAuthenticated: Boolean(user && localStorage.getItem('token')),
    login,
    logout,
    setUser,
  }), [login, logout, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
