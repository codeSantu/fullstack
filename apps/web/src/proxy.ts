import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Edge Proxy for Route Protection.
 * Reads the auth_token cookie set by our auth.ts lib.
 * Redirects unauthenticated requests for /dashboard/* back to the root (/).
 */
export function proxy(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    const isDashboard = pathname.startsWith('/dashboard')

    if (isDashboard && !token) {
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*']
}