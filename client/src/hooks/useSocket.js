// Purpose: Hook for managing a real-time socket connection.
import { useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

export default function useSocket() {
  const token = localStorage.getItem('token')
  const socket = useMemo(() => io(SOCKET_URL, {
    autoConnect: false,
    auth: { token },
    transports: ['websocket', 'polling'],
  }), [token])

  useEffect(() => {
    if (token) socket.connect()
    return () => socket.disconnect()
  }, [socket, token])

  return socket
}
