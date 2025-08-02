"use client"

import { useQuery } from '@tanstack/react-query'
import { HealthMetrics } from './health-metrics'
import { ActivitySummary } from './activity-summary'
import { PredictionAlerts } from './prediction-alerts'
import { RecentNotifications } from './recent-notifications'
import apiClient from '../../lib/api-client'
import { SettingsManager } from './settings-manager'

export function DashboardOverview() {
  // Fetch dashboard summary data
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const [health, activities, predictions, notifications] = await Promise.all([
        apiClient.get('/api/health/records?limit=5'),
        apiClient.get('/api/activities?limit=5'),
        apiClient.get('/api/predictions?active=true'),
        apiClient.get('/api/notifications?unread=true')
      ])

      return {
        recentHealth: health.data.records,
        recentActivities: activities.data.activities,
        activePredictions: predictions.data.predictions,
        unreadNotifications: notifications.data.notifications
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">
          Monitor your health metrics and get AI-powered insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Health Records</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary?.recentHealth?.length || 0}
          </p>
          <p className="mt-1 text-sm text-gray-600">This month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Activities</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary?.recentActivities?.length || 0}
          </p>
          <p className="mt-1 text-sm text-gray-600">This week</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Risk Alerts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary?.activePredictions?.filter((p: any) => p.riskScore > 70).length || 0}
          </p>
          <p className="mt-1 text-sm text-red-600">Active alerts</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Notifications</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary?.unreadNotifications?.length || 0}
          </p>
          <p className="mt-1 text-sm text-gray-600">Unread</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HealthMetrics />
        </div>
        <div className="space-y-6">
          <PredictionAlerts />
          <RecentNotifications />
        </div>
      </div>

      {/* Activity Summary */}
      <ActivitySummary />
    </div>
  )
}