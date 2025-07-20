"use client"

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, TrendingUp, Activity, Heart } from 'lucide-react'
import apiClient from '../../lib/api-client'

interface Prediction {
    id: string
    type: string
    riskScore: number
    confidence: number
    factors: any
    createdAt: string
}

const RISK_LEVELS = {
    low: { color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    medium: { color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    high: { color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700' }
}

const PREDICTION_ICONS = {
    diabetes_risk: TrendingUp,
    heart_disease_risk: Heart,
    general_health: Activity
}

export function PredictionAlerts() {
    const { data: predictions, isLoading } = useQuery({
        queryKey: ['predictions', 'active'],
        queryFn: async () => {
            const response = await apiClient.get('/api/predictions?active=true')
            return response.data.predictions
        }
    })

    const getRiskLevel = (score: number) => {
        if (score >= 70) return 'high'
        if (score >= 40) return 'medium'
        return 'low'
    }

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Health Predictions</h3>

            {predictions && predictions.length > 0 ? (
                <div className="space-y-4">
                    {predictions.map((prediction: Prediction) => {
                        const riskLevel = getRiskLevel(prediction.riskScore)
                        const style = RISK_LEVELS[riskLevel]
                        const Icon = PREDICTION_ICONS[prediction.type as keyof typeof PREDICTION_ICONS] || AlertTriangle
                        return (
                            <div
                                key={prediction.id}
                                className={`p-4 rounded-lg border ${style.bgColor} ${style.textColor} border-${style.color}-200`}
                            >
                                <div className="flex items-start space-x-3">
                                    <Icon className="h-5 w-5 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-medium">
                                            {prediction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </h4>
                                        <div className="mt-1 flex items-center space-x-4 text-sm">
                                            <span>Risk Score: {prediction.riskScore}%</span>
                                            <span>Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        {prediction.factors && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-medium">Contributing Factors:</p>
                                                <ul className="mt-1 list-disc list-inside">
                                                    {Object.entries(prediction.factors).map(([key, value]) => (
                                                        <li key={key}>
                                                            {key.replace(/_/g, ' ')}: {String(value)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    <button className="w-full mt-4 text-center text-sm text-indigo-600 hover:text-indigo-500">
                        View All Predictions →
                    </button>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No active predictions</p>
                    <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-500">
                        Generate Health Analysis
                    </button>
                </div>
            )}
        </div>
    )
}