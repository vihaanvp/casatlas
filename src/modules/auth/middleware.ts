import NextAuth from "next-auth"
import authConfig from "@/modules/auth/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")
  const isPublicFile = req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname === "/favicon.ico"

  if (isApiAuth || isPublicFile) return

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.url))
    }
    return
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files).*)"],
}
