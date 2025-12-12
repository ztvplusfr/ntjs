import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'

// IP autorisées pour l'accès admin
const ADMIN_IPS = ['165.169.45.189', '192.168.1.3']

// Discord IDs autorisés pour l'accès admin
const ADMIN_DISCORD_IDS = ['1054291367246958642']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier l'accès admin
  if (pathname.startsWith('/admin')) {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      request.headers.get('x-real-ip') || 
      'unknown'

    console.log(`Admin access attempt from IP: ${clientIP}`)

    // Vérifier l'IP
    if (!ADMIN_IPS.includes(clientIP)) {
      console.log(`Access denied for IP: ${clientIP}`)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Vérifier le token JWT
    try {
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        console.log('No auth token found')
        return NextResponse.redirect(new URL('/api/auth/discord', request.url))
      }

      const payload = verifyToken(token)

      if (!payload?.user?.id || !ADMIN_DISCORD_IDS.includes(payload.user.id)) {
        console.log(`Access denied for user: ${payload?.user?.id || 'anonymous'}`)
        return NextResponse.redirect(new URL('/api/auth/discord', request.url))
      }

      console.log(`Admin access granted for user: ${payload.user.id}`)
    } catch (error) {
      console.error('Error checking token:', error)
      return NextResponse.redirect(new URL('/api/auth/discord', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
