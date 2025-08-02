import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { PredictionsManager } from '../../../components/dashboard/predictions-manager'

export default async function PredictionsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Predictions</h1>
          <p className="mt-2 text-gray-600">
            AI-powered health risk assessments and predictive analytics
          </p>
        </div>
        <PredictionsManager />
      </div>
    </DashboardLayout>
  )
}