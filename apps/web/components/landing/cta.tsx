"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'

export function CTA() {
    return (
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl lg:text-4xl font-bold text-white mb-6"
                >
                    Start Your Health Journey Today
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl text-indigo-100 mb-8"
                >
                    Join thousands who are taking control of their health with AI-powered insights
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition group"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/demo"
                        className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
                    >
                        Watch Demo
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center text-white/90"
                >
                    <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>No credit card required</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>14-day free trial</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Cancel anytime</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
