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
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || !session.accessToken) return console.log("hi")

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006', {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: session.accessToken, // ✅ Attach JWT to the socket auth
      },
    })

    const handleConnect = () => {
      console.log('✅ Connected to WebSocket')
      setConnected(true)
      socketInstance.emit('authenticate', session.user.id)
    }

    const handleDisconnect = () => {
      console.log('❌ Disconnected from WebSocket')
      setConnected(false)
    }

    const handleAuthenticated = (data: any) => {
      console.log('🔐 WebSocket authenticated:', data)
      socketInstance.emit('subscribe_health_updates', session.user.id)
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('authenticated', handleAuthenticated)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('authenticated', handleAuthenticated)
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
