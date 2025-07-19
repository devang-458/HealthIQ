"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import apiClient from '../../lib/api-client'
import { useSocket } from '../../contexts/socket-context'

interface HealthRecord {
    id: string
    date: string
    weight?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    heartRate?: number
    sleepHours?: number
}

export function HealthMetrics() {
    const queryClient = useQueryClient()
    const { socket } = useSocket()
    const [showAddForm, setShowAddForm] = useState(false)

    // Fetch health records
    const { data, isLoading, error } = useQuery({
        queryKey: ['health-records'],
        queryFn: async () => {
            const response = await apiClient.get('/api/health/records')
            return response.data.records
        }
    })

    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return

        socket.on('health_record_created', (record) => {
            queryClient.invalidateQueries({ queryKey: ['health-records'] })
        })

        socket.on('health_record_updated', (record) => {
            queryClient.invalidateQueries({ queryKey: ['health-records'] })
        })

        socket.on('health_record_deleted', ({ id }) => {
            queryClient.invalidateQueries({ queryKey: ['health-records'] })
        })

        return () => {
            socket.off('health_record_created')
            socket.off('health_record_updated')
            socket.off('health_record_deleted')
        }
    }, [socket, queryClient])

    // Add health record mutation
    const addRecordMutation = useMutation({
        mutationFn: async (data: Partial<HealthRecord>) => {
            const response = await apiClient.post('/api/health/records', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['health-records'] })
            setShowAddForm(false)
        }
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Error loading health records
            </div>
        )
    }

    const chartData = data?.map((record: HealthRecord) => ({
        date: format(new Date(record.date), 'MMM dd'),
        weight: record.weight,
        systolic: record.bloodPressureSystolic,
        diastolic: record.bloodPressureDiastolic,
        heartRate: record.heartRate,
    })).reverse()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Add Record
                </button>
            </div>

            {/* Add Record Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Add Health Record</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            addRecordMutation.mutate({
                                date: new Date().toISOString(),
                                weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
                                bloodPressureSystolic: formData.get('systolic') ? Number(formData.get('systolic')) : undefined,
                                bloodPressureDiastolic: formData.get('diastolic') ? Number(formData.get('diastolic')) : undefined,
                                heartRate: formData.get('heartRate') ? Number(formData.get('heartRate')) : undefined,
                                sleepHours: formData.get('sleepHours') ? Number(formData.get('sleepHours')) : undefined,
                            })
                        }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                step="0.1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Heart Rate (bpm)</label>
                            <input
                                type="number"
                                name="heartRate"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Systolic BP</label>
                            <input
                                type="number"
                                name="systolic"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Diastolic BP</label>
                            <input
                                type="number"
                                name="diastolic"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                            <label className="block text-sm font-medium text-gray-700">Sleep Hours</label>
                            <input type="number"
                                name="sleepHours"
                                step="0.5"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
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
                                    disabled={addRecordMutation.isPending}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {addRecordMutation.isPending ? 'Saving...' : 'Save Record'}
                                </button>
                            </div>
                    </form>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weight Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Weight Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={{ fill: '#6366f1' }}
                                name="Weight (kg)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Blood Pressure Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Blood Pressure</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="systolic"
                                stroke="#ef4444"
                                strokeWidth={2}
                                name="Systolic"
                            />
                            <Line
                                type="monotone"
                                dataKey="diastolic"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Diastolic"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Heart Rate Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Heart Rate</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="heartRate"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                                name="Heart Rate (bpm)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Latest Metrics Summary */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Latest Metrics</h3>
                    {data && data.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Weight</span>
                                <span className="font-medium">{data[0].weight || '-'} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Blood Pressure</span>
                                <span className="font-medium">
                                    {data[0].bloodPressureSystolic && data[0].bloodPressureDiastolic
                                        ? `${data[0].bloodPressureSystolic}/${data[0].bloodPressureDiastolic}`
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Heart Rate</span>
                                <span className="font-medium">{data[0].heartRate || '-'} bpm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Sleep</span>
                                <span className="font-medium">{data[0].sleepHours || '-'} hours</span>
                            </div>
                            <div className="pt-4 border-t">
                                <span className="text-sm text-gray-500">
                                    Last updated: {format(new Date(data[0].date), 'PPp')}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No records yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}