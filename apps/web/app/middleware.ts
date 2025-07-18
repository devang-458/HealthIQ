import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }
        if (req.nextUrl.pathname.startsWith("/api/health") ||
            req.nextUrl.pathname.startsWith("/api/predictions")) {
          return !!token
        }
        return true
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    }
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/health/:path*",
    "/api/predictions/:path*",
  ],
}