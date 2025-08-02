"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { User, Bell, Shield, Palette, Download, Trash2, Save, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import apiClient from '../../lib/api-client'

const settingsSections = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'data', name: 'Data Management', icon: Download },
]

export function SettingsManager() {
    const { data: session, update } = useSession()
    const [activeSection, setActiveSection] = useState('profile')
    const [saved, setSaved] = useState(false)

    const [profile, setProfile] = useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        height: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })

    const [settings, setSettings] = useState({
        notifications: {
            emailAlerts: true,
            pushNotifications: true,
            healthAlerts: true,
            weeklyReports: true,
            recommendations: true,
            reminderTime: '09:00'
        },
        privacy: {
            shareAnonymousData: false,
            allowAnalytics: true,
            marketingEmails: false,
            publicProfile: false
        },
        appearance: {
            theme: 'light',
            compactMode: false,
            showTrends: true,
            defaultView: 'dashboard'
        }
    })

    // Save settings mutation
    const saveSettingsMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.put('/api/user/settings', data)
            return response.data
        },
        onSuccess: () => {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    })

    const handleToggle = (section: 'notifications' | 'privacy' | 'appearance', key: string) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev] as Record<string, any>,
                [key]: !(
                    prev[section as keyof typeof prev] as Record<string, any>
                )[key]
            }
        }));
    };


    const handleSave = () => {
        const dataToSave = activeSection === 'profile' ? { profile } : { settings }
        saveSettingsMutation.mutate(dataToSave)
    }

    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    placeholder="+1 (555) 123-4567"
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    value={profile.dateOfBirth}
                                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    value={profile.gender}
                                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                <input
                                    type="number"
                                    value={profile.height}
                                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                                    placeholder="170"
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                                <select
                                    value={profile.timezone}
                                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                                    className="mt-1 block p-2 border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value={profile.timezone}>{profile.timezone}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                            {Object.entries(settings.notifications).map(([key, value]) => {
                                if (key === 'reminderTime') return null
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {getNotificationDescription(key)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('notifications', key)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Reminder Time</h3>
                            <input
                                type="time"
                                value={settings.notifications.reminderTime}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, reminderTime: e.target.value }
                                })}
                                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )

            case 'privacy':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {Object.entries(settings.privacy).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {getPrivacyDescription(key)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle('privacy', key)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                            <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                Change Password
                            </button>
                        </div>
                    </div>
                )

            case 'appearance':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['light', 'dark', 'auto'].map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => setSettings({
                                            ...settings,
                                            appearance: { ...settings.appearance, theme }
                                        })}
                                        className={`p-4 rounded-lg border-2 transition-colors ${settings.appearance.theme === theme
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-medium capitalize">{theme}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Compact Mode</p>
                                    <p className="text-sm text-gray-500">Reduce spacing and use smaller fonts</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('appearance', 'compactMode')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.appearance.compactMode ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Show Trends</p>
                                    <p className="text-sm text-gray-500">Display trend indicators on dashboard</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('appearance', 'showTrends')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.appearance.showTrends ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.appearance.showTrends ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )

            case 'data':
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-blue-900 mb-2">Export Your Data</h3>
                            <p className="text-sm text-blue-700 mb-4">
                                Download all your health data in a portable format
                            </p>
                            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                <Download className="h-4 w-4 mr-2" />
                                Export Data (CSV)
                            </button>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-red-900 mb-2">Delete Account</h3>
                            <p className="text-sm text-red-700 mb-4">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
                <nav className="space-y-1">
                    {settingsSections.map((section) => {
                        const Icon = section.icon
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === section.id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {section.name}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-lg shadow p-6"
                >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {settingsSections.find(s => s.id === activeSection)?.name}
                    </h2>

                    {renderSection()}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saveSettingsMutation.isPending}
                            className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors ${saved
                                ? 'bg-green-600 text-white'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                } disabled:opacity-50`}
                        >
                            {saved ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// Helper functions
function getNotificationDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
        emailAlerts: 'Receive important health alerts via email',
        pushNotifications: 'Get push notifications on your devices',
        healthAlerts: 'Be notified of abnormal health readings',
        weeklyReports: 'Receive weekly health summary reports',
        recommendations: 'Get personalized health recommendations'
    }
    return descriptions[key] || ''
}

function getPrivacyDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
        shareAnonymousData: 'Help improve our service by sharing anonymous usage data',
        allowAnalytics: 'Allow us to analyze your usage patterns',
        marketingEmails: 'Receive updates about new features and health tips',
        publicProfile: 'Make your profile visible to other users'
    }
    return descriptions[key] || ''
}