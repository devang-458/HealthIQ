"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import apiClient from '../../lib/api-client'
import { useSocket } from '../../contexts/socket-context'

interface Activity {
  id: string
  date: string
  type: string
  duration: number
  distance?: number
  calories?: number
}

const ACTIVITY_COLORS = {
  walking: '#10b981',
  running: '#3b82f6',
  cycling: '#f59e0b',
  swimming: '#8b5cf6',
  gym: '#ef4444',
  yoga: '#ec4899',
  other: '#6b7280'
}

export function ActivitySummary() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  // Fetch activities for the selected week
  const weekStart = startOfWeek(selectedWeek)
  const weekEnd = endOfWeek(selectedWeek)

  const { data, isLoading } = useQuery({
    queryKey: ['activities', weekStart, weekEnd],
    queryFn: async () => {
      const response = await apiClient.get('/api/activities', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        }
      })
      return response.data
    }
  })

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      const response = await apiClient.post('/api/activities', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setShowAddForm(false)
    }
  })

  // Process data for charts
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const dailyData = weekDays.map(day => {
    const dayActivities = data?.activities?.filter((a: Activity) => 
      format(new Date(a.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ) || []
    
    return {
      day: format(day, 'EEE'),
      date: format(day, 'MMM dd'),
      duration: dayActivities.reduce((sum: number, a: Activity) => sum + a.duration, 0),
      calories: dayActivities.reduce((sum: number, a: Activity) => sum + (a.calories || 0), 0)
    }
  })

  // Activity type distribution
  const typeDistribution = data?.activities?.reduce((acc: any, activity: Activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + activity.duration
    return acc
  }, {}) || {}

  const pieData = Object.entries(typeDistribution).map(([type, duration]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: duration as number,
    color: ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.other
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Activity Tracking</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newWeek = new Date(selectedWeek)
                newWeek.setDate(newWeek.getDate() - 7)
                setSelectedWeek(newWeek)
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="text-sm font-medium">
              {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
            </span>
            <button
              onClick={() => {
                const newWeek = new Date(selectedWeek)
                newWeek.setDate(newWeek.getDate() + 7)
                setSelectedWeek(newWeek)
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Log Activity
          </button>
        </div>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Log New Activity</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addActivityMutation.mutate({
                date: new Date(formData.get('date') as string).toISOString(),
                type: formData.get('type') as string,
                duration: Number(formData.get('duration')),
                distance: formData.get('distance') ? Number(formData.get('distance')) : undefined,
                calories: formData.get('calories') ? Number(formData.get('calories')) : undefined,
              })
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="datetime-local"
                name="date"
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Activity Type</label>
              <select
                name="type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="swimming">Swimming</option>
                <option value="gym">Gym</option>
                <option value="yoga">Yoga</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
              <input
                type="number"
                name="distance"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Calories Burned</label>
              <input
                type="number"
                name="calories"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addActivityMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {addActivityMutation.isPending ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="duration" fill="#6366f1" name="Duration (min)" />
              <Bar dataKey="calories" fill="#10b981" name="Calories" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Activity Types</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center mt-20">No activities this week</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Duration</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data?.summary?.totalDuration || 0} min
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Distance</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data?.summary?.totalDistance?.toFixed(1) || 0} km
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Calories Burned</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data?.summary?.totalCalories || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Activities</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data?.summary?.totalActivities || 0}
          </p>
        </div>
      </div>
    </div>
  )
}