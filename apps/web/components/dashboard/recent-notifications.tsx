"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import apiClient from '../../lib/api-client'
import { useEffect } from 'react'
import { useSocket } from '../../contexts/socket-context'

interface Notification {
  id: string
  type: 'alert' | 'recommendation' | 'reminder' | 'info'
  title: string
  message: string
  read: boolean
  createdAt: string
}

const NOTIFICATION_ICONS = {
  alert: AlertCircle,
  recommendation: Info,
  reminder: Bell,
  info: Info
}

const NOTIFICATION_STYLES = {
  alert: 'text-red-600 bg-red-50',
  recommendation: 'text-blue-600 bg-blue-50',
  reminder: 'text-yellow-600 bg-yellow-50',
  info: 'text-gray-600 bg-gray-50'
}

export function RecentNotifications() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await apiClient.get('/api/notifications?limit=5')
      return response.data.notifications
    }
  })

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Listen for new notifications
  useEffect(() => {
    if (!socket) return

    socket.on('new_notification', (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png'
        })
      }
    })

    return () => {
      socket.off('new_notification')
    }
  }, [socket, queryClient])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Notifications</h3>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type]
            const style = NOTIFICATION_STYLES[notification.type]
            
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg ${notification.read ? 'opacity-60' : ''} ${
                  notification.read ? 'bg-gray-50' : style
                } cursor-pointer transition-all hover:shadow-sm`}
                onClick={() => {
                  if (!notification.read) {
                    markAsReadMutation.mutate(notification.id)
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${notification.read ? 'text-gray-400' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            )
          })}
          
          <button className="w-full mt-4 text-center text-sm text-indigo-600 hover:text-indigo-500">
            View All Notifications →
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications</p>
        </div>
      )}
    </div>
  )
}