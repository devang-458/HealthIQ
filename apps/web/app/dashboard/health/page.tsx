import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { HealthMetrics } from '../../../components/dashboard/health-metrics'

export default async function HealthRecordsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <p className="mt-2 text-gray-600">
            Track and manage your vital health metrics over time
          </p>
        </div>
        <HealthMetrics />
      </div>
    </DashboardLayout>
  )
}