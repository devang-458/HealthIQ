"use client"

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const benefits = [
  {
    title: 'Early Disease Detection',
    description: 'AI algorithms identify potential health risks before symptoms appear, enabling preventive care.',
    image: '/benefit-1.jpg'
  },
  {
    title: 'Personalized Recommendations',
    description: 'Get tailored advice on diet, exercise, and lifestyle based on your unique health profile.',
    image: '/benefit-2.jpg'
  },
  {
    title: 'Comprehensive Health View',
    description: 'All your health data in one place - from daily metrics to lab results and activity logs.',
    image: '/benefit-3.jpg'
  }
]

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl lg:text-4xl font-bold text-gray-900"
          >
            Why Choose HealthTrack AI?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Experience the future of personal health management
          </motion.p>
        </div>

        <div className="space-y-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
            >
              <div className="flex-1">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {benefit.description}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Real-time monitoring and alerts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Evidence-based recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Secure and private data storage</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src="https://cdn.boldbi.com/wp/pages/dashboards/healthcare/patient-health-monitoring-v1-banner.webp"
                        alt="Health AI Dashboard Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-4">
                        <p className="text-white text-sm">Interactive Dashboard Preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}