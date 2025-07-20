// "use client"

// import { DashboardLayout } from '../../components/layout/dashboard-layout'
// import { DashboardOverview } from '../../components/layout/overview'
// import { useSession } from 'next-auth/react'

// export default async function DashboardPage() {
//   const { data: session, status } = useSession()

//   if (status === "loading") return <p>Loading...</p>
//   return (
//       <DashboardLayout>
//         <DashboardOverview />
//       </DashboardLayout>
//   )
// }

"use client"
import { DashboardLayout } from "components/layout/dashboard-layout"
import { DashboardOverview } from "components/dashboard/overview"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  if (status === "loading") return <div>Loading...</div>

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}
