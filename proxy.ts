import authConfig from "./auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const userRole = (req.auth?.user as any)?.role

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
    const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname === "/login"
    const isAuthRoute = nextUrl.pathname === "/login"

    // Admin-only routes
    const isAdminRoute = nextUrl.pathname.startsWith("/users") ||
        nextUrl.pathname.startsWith("/settings")

    if (isApiAuthRoute) {
        return
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/inventory", nextUrl))
        }
        return
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/login", nextUrl))
    }

    // Block non-admin users from admin routes
    if (isLoggedIn && isAdminRoute && userRole !== 'admin') {
        return Response.redirect(new URL("/inventory", nextUrl))
    }

    return
})

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
