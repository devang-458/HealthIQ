"use client"

import { motion } from 'framer-motion'
import {
    Activity,
    Brain,
    LineChart,
    Bell,
    Shield,
    Smartphone,
    Heart,
    TrendingUp
} from 'lucide-react'

const features = [
    {
        icon: LineChart,
        title: 'Real-Time Health Tracking',
        description: 'Monitor vital signs, weight, blood pressure, and other health metrics with interactive charts and visualizations.',
        color: 'bg-blue-100 text-blue-600'
    },
    {
        icon: Brain,
        title: 'AI-Powered Predictions',
        description: 'Advanced machine learning algorithms analyze your data to predict potential health risks before they occur.',
        color: 'bg-purple-100 text-purple-600'
    },
    {
        icon: Activity,
        title: 'Activity Monitoring',
        description: 'Track workouts, steps, calories burned, and get insights into your fitness progress over time.',
        color: 'bg-green-100 text-green-600'
    },
    {
        icon: Bell,
        title: 'Smart Notifications',
        description: 'Receive timely alerts about medication reminders, health anomalies, and personalized recommendations.',
        color: 'bg-yellow-100 text-yellow-600'
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Your health data is encrypted and stored securely. We prioritize your privacy and data protection.',
        color: 'bg-red-100 text-red-600'
    },
    {
        icon: Smartphone,
        title: 'Multi-Device Sync',
        description: 'Access your health dashboard from any device. Real-time synchronization keeps your data up-to-date.',
        color: 'bg-indigo-100 text-indigo-600'
    }
]

export function Features() {
    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl lg:text-4xl font-bold text-gray-900"
                    >
                        Everything You Need for Better Health
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
                    >
                        Comprehensive health monitoring with cutting-edge AI technology to help you make informed decisions about your wellness.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}