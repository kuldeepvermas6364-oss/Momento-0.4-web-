import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Read the JWT directly in Edge middleware. Importing the full NextAuth
  // configuration here also bundles Prisma, bcrypt, and the database adapter,
  // which can exceed Vercel's Edge Function size limit.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })
  const isAuthenticated = !!token

  const publicPaths = ["/login", "/register", "/api/auth"]
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", req.url)
    // Only allow relative paths as callback to prevent open redirect
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      loginUrl.searchParams.set("callbackUrl", pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/posts", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/trpc|api/socket).*)"],
}
