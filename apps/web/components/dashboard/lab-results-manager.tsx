"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, TrendingUp, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import apiClient from '../../lib/api-client'

interface LabResult {
  id: string
  date: string
  testType: string
  value: number
  unit: string
  normalRange?: string
  createdAt: string
}

export function LabResultsManager() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)

  // Fetch lab results
  const { data, isLoading } = useQuery({
    queryKey: ['lab-results'],
    queryFn: async () => {
      const response = await apiClient.get('/api/lab-results')
      return response.data
    }
  })

  // Add lab result mutation
  const addResultMutation = useMutation({
    mutationFn: async (data: Partial<LabResult>) => {
      const response = await apiClient.post('/api/lab-results', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] })
      setShowAddForm(false)
    }
  })

  // Delete lab result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/lab-results/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] })
    }
  })

  const isAbnormal = (value: number, normalRange?: string): boolean => {
    if (!normalRange) return false
    const [min, max] = normalRange.split('-').map(Number)
    return value < min! || value > max!
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const testTypes = Object.keys(data?.grouped || {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTest || ''}
            onChange={(e) => setSelectedTest(e.target.value || null)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Test Types</option>
            {testTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Lab Result
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add Lab Result</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addResultMutation.mutate({
                date: new Date(formData.get('date') as string).toISOString(),
                testType: formData.get('testType') as string,
                value: Number(formData.get('value')),
                unit: formData.get('unit') as string,
                normalRange: formData.get('normalRange') as string || undefined
              })
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Date</label>
              <input
                type="datetime-local"
                name="date"
                required
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-lg border-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Type</label>
              <input
                type="text"
                name="testType"
                required
                placeholder="e.g., Blood Sugar, Cholesterol"
                className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-lg border-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <input
                type="number"
                name="value"
                step="0.01"
                required
                className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-lg border-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                name="unit"
                required
                placeholder="e.g., mg/dL, mmol/L"
                className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-lg border-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Normal Range (optional)</label>
              <input
                type="text"
                name="normalRange"
                placeholder="e.g., 70-100"
                className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-lg border-2 focus:border-indigo-500 focus:ring-indigo-500"
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
                disabled={addResultMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {addResultMutation.isPending ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Results by Test Type */}
      {testTypes.length > 0 ? (
        <div className="space-y-6">
          {testTypes
            .filter(type => !selectedTest || type === selectedTest)
            .map(testType => (
              <div key={testType} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-400" />
                    {testType}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Normal Range
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.grouped[testType].map((result: LabResult) => {
                          const abnormal = isAbnormal(result.value, result.normalRange)
                          return (
                            <tr key={result.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(result.date), 'PPp')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={abnormal ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {result.value} {result.unit}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.normalRange || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {abnormal ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Abnormal
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Normal
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => deleteResultMutation.mutate(result.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No lab results yet</p>
          <p className="text-sm text-gray-400 mt-2">Add your first lab result to start tracking</p>
        </div>
      )}
    </div>
  )
}