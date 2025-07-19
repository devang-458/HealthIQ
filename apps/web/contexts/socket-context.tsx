"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket')
      setConnected(true)
      
      if (session.user) {
        socketInstance.emit('authenticate', session.user.id)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket')
      setConnected(false)
    })

    socketInstance.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data)
      socketInstance.emit('subscribe_health_updates', session.user.id)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}