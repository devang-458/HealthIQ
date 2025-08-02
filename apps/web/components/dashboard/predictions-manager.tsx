"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Brain, AlertTriangle, TrendingUp, Activity, Heart, RefreshCw, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import apiClient from '../../lib/api-client'
import { motion } from 'framer-motion'

interface Prediction {
  id: string
  type: string
  riskScore: number
  confidence: number
  factors: any
  createdAt: string
  expiresAt: string
}

const PREDICTION_TYPES = [
  {
    id: 'diabetes_risk',
    name: 'Diabetes Risk',
    description: 'Assess your risk of developing type 2 diabetes',
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 'heart_disease_risk',
    name: 'Heart Disease Risk',
    description: 'Evaluate cardiovascular health risks',
    icon: Heart,
    color: 'red'
  },
  {
    id: 'general_health',
    name: 'General Health',
    description: 'Overall health assessment and recommendations',
    icon: Activity,
    color: 'green'
  }
]

export function PredictionsManager() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Fetch predictions
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/predictions')
      return response.data.predictions
    }
  })

  // Generate prediction mutation
  const generatePredictionMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiClient.post('/api/predictions/generate', { type })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
    }
  })

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'red' }
    if (score >= 40) return { level: 'Medium', color: 'yellow' }
    return { level: 'Low', color: 'green' }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Prediction Types Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {PREDICTION_TYPES.map((type) => {
          const Icon = type.icon
          const latestPrediction = predictions?.find((p: Prediction) => p.type === type.id)
          
          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedType(type.id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${type.color}-100`}>
                    <Icon className={`h-6 w-6 text-${type.color}-600`} />
                  </div>
                  {latestPrediction && (
                    <span className={`text-sm font-medium ${getRiskColor(latestPrediction.riskScore)} text-white px-2 py-1 rounded`}>
                      {getRiskLevel(latestPrediction.riskScore).level} Risk
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                
                {latestPrediction ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Risk Score</span>
                      <span className="font-medium">{latestPrediction.riskScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium">
                        {format(new Date(latestPrediction.createdAt), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No assessment yet</p>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    generatePredictionMutation.mutate(type.id)
                  }}
                  disabled={generatePredictionMutation.isPending}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generatePredictionMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Active Predictions */}
      {predictions && predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Active Predictions</h2>
          </div>
          <div className="divide-y">
            {predictions.map((prediction: Prediction) => {
              const risk = getRiskLevel(prediction.riskScore)
              const typeInfo = PREDICTION_TYPES.find(t => t.id === prediction.type)
              const Icon = typeInfo?.icon || AlertTriangle
              
              return (
                <div
                  key={prediction.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setShowDetails(showDetails === prediction.id ? null : prediction.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg bg-${risk.color}-100`}>
                        <Icon className={`h-5 w-5 text-${risk.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {prediction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Risk Score: {prediction.riskScore}%</span>
                          <span>•</span>
                          <span>Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>Generated {format(new Date(prediction.createdAt), 'PPp')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                      showDetails === prediction.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  {/* Risk Indicator Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getRiskColor(prediction.riskScore)}`}
                        style={{ width: `${prediction.riskScore}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {showDetails === prediction.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">Contributing Factors:</h4>
                      <div className="space-y-2">
                        {Object.entries(prediction.factors).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="font-medium text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                          <li>Schedule a consultation with your healthcare provider</li>
                          <li>Monitor related health metrics more frequently</li>
                          <li>Consider lifestyle modifications based on risk factors</li>
                        </ul>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Expires: {format(new Date(prediction.expiresAt), 'PPP')}
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Health Coach Integration */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Need Help Understanding Your Predictions?</h3>
            <p className="text-indigo-100">
              Chat with our AI Health Coach for personalized insights and recommendations
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/ai-coach'}
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Talk to AI Coach
          </button>
        </div>
      </div>
    </div>
  )
}