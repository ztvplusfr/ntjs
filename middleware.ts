import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IP autorisées pour l'accès admin
const ADMIN_IPS = ['165.169.45.189', '192.168.1.3']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route est dans /admin
  if (pathname.startsWith('/admin')) {
    // Obtenir l'IP du client
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp

    console.log(`Admin access attempt from IP: ${clientIp} to path: ${pathname}`)

    // Vérifier si l'IP est autorisée
    if (!clientIp || !ADMIN_IPS.includes(clientIp)) {
      console.log(`Unauthorized admin access attempt from IP: ${clientIp}`)
      
      // Rediriger vers la page d'accueil si non autorisé
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    console.log(`Authorized admin access from IP: ${clientIp}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
