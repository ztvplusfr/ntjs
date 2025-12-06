import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// IP autorisées pour l'accès admin
const ADMIN_IPS = ['165.169.45.189', '192.168.1.3']

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = ['/', '/auth/signin', '/auth/error', '/logout', '/api/auth', '/api/logout', '/api/clean-auth']

// Vérifier si une route est publique
function isPublicRoute(pathname: string): boolean {
  // Vérification exacte
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }
  
  // Vérification des routes API (commencent par /api/auth)
  if (pathname.startsWith('/api/auth')) {
    return true
  }
  
  // Vérification explicite pour les API de logout
  if (pathname === '/api/logout' || pathname === '/api/clean-auth') {
    return true
  }
  
  // Fichiers statiques (images, css, js, etc.)
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.') && 
      (pathname.endsWith('.png') || 
       pathname.endsWith('.jpg') || 
       pathname.endsWith('.jpeg') || 
       pathname.endsWith('.gif') || 
       pathname.endsWith('.svg') || 
       pathname.endsWith('.ico') || 
       pathname.endsWith('.css') || 
       pathname.endsWith('.js'))) {
    return true
  }
  
  // La page d'accueil uniquement
  if (pathname === '/') {
    return true
  }
  
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`Middleware: Checking path: ${pathname}`)

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

  // Vérifier si la route est publique
  const isRoutePublic = isPublicRoute(pathname)

  console.log(`Is public route: ${isRoutePublic} for path: ${pathname}`)

  // Si ce n'est pas une route publique, vérifier l'authentification
  if (!isRoutePublic) {
    console.log(`Checking authentication for protected route: ${pathname}`)
    
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    console.log(`Token found: ${!!token}`)

    // Si l'utilisateur n'est pas authentifié, rediriger vers la page de login
    if (!token) {
      console.log(`Redirecting unauthenticated user from: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (sign in page)
     * - auth/error (auth error page)
     * - logout (logout page)
     * - clean-auth (clean auth endpoint)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/error|logout|clean-auth).*)',
  ]
}
