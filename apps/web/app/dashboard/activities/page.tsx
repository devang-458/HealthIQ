import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { ActivitySummary } from '../../../components/dashboard/activity-summary'

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="mt-2 text-gray-600">
            Log and track your physical activities and workouts
          </p>
        </div>
        <ActivitySummary />
      </div>
    </DashboardLayout>
  )
}