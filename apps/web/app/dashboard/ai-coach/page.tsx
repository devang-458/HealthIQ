import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { AIHealthCoach } from '../../../components/dashboard/ai-health-coach'

export default async function AICoachPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Health Coach</h1>
          <p className="mt-2 text-gray-600">
            Get personalized health insights and recommendations from your AI assistant
          </p>
        </div> */}
        <AIHealthCoach />
      </div>
    </DashboardLayout>
  )
}