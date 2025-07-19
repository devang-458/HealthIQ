import { Inter } from "next/font/google"
import { AuthProvider } from "../providers/auth-provider" 
import { SocketProvider } from "../contexts/socket-context"
import { QueryProvider } from "../providers/query-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Health Analytics Dashboard",
  description: "Personal health monitoring and analytics platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
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