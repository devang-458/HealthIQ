import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { NextAuthMiddlewareOptions } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as NextRequest & { nextauth: { token: any } }).nextauth.token
    const { pathname } = req.nextUrl

    console.log(`[AUTH] ${token?.email} is accessing ${pathname}, role: ${token?.role}`)

    if (token?.isBlocked) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/dashboard/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        if (
          path.startsWith("/dashboard") ||
          path.startsWith("/api/health") ||
          path.startsWith("/api/predictions")
        ) {
          return !!token
        }

        return true
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  } satisfies NextAuthMiddlewareOptions 
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/health/:path*",
    "/api/predictions/:path*",
  ],
}
