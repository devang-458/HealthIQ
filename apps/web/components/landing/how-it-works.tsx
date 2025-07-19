"use client"

import { motion } from 'framer-motion'
import { UserPlus, Database, Brain, LineChart } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in seconds and set up your personal health profile with basic information.',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    number: '02',
    icon: Database,
    title: 'Input Health Data',
    description: 'Log your vital signs, lab results, activities, and other health metrics regularly.',
    color: 'text-green-600 bg-green-100'
  },
  {
    number: '03',
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our AI analyzes your data patterns and generates personalized health insights.',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    number: '04',
    icon: LineChart,
    title: 'Track Progress',
    description: 'Monitor trends, receive predictions, and follow AI-recommended health improvements.',
    color: 'text-indigo-600 bg-indigo-100'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl lg:text-4xl font-bold text-gray-900"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Get started with your health journey in four simple steps
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-xl p-6 text-center relative z-10">
                  <div className={`inline-flex p-4 rounded-full ${step.color} mb-4`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 mb-2">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}