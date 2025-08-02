import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { LabResultsManager } from '../../../components/dashboard/lab-results-manager'

export default async function LabResultsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          <p className="mt-2 text-gray-600">
            Store and track your laboratory test results
          </p>
        </div>
        <LabResultsManager />
      </div>
    </DashboardLayout>
  )
}