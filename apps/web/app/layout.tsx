
import { Inter } from "next/font/google"
import { AuthProvider } from "../providers/auth-provider"
import { SocketProvider } from "../contexts/socket-context"
import { QueryProvider } from "../providers/query-provider"
import "./globals.css"
import { getServerSession } from "next-auth"
import { authOptions } from "../lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Health Analytics Dashboard",
  description: "Personal health monitoring and analytics platform",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const sesssion = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider session={sesssion} >
          <QueryProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}