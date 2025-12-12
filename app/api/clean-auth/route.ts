import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'

export async function POST(request: NextRequest) {
  try {
    // Récupérer la session pour obtenir le token Discord
    const token = request.cookies.get('auth-token')?.value
    let discordToken = null
    
    if (token) {
      const payload = verifyToken(token)
      // Note: Discord access token n'est pas stocké dans notre JWT
      // La révocation Discord devra être gérée différemment si nécessaire
    }

    // Liste complète des cookies d'authentification
    const cookieNames = [
      'auth-token',
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Host-next-auth.callback-url',
      'authjs.session-token',
      'authjs.csrf-token',
      'authjs.callback-url',
      '__Secure-authjs.session-token',
      '__Secure-authjs.csrf-token',
      '__Secure-authjs.callback-url',
      '__Host-authjs.session-token',
      '__Host-authjs.csrf-token',
      '__Host-authjs.callback-url',
    ]

    // Créer une réponse qui va nettoyer tous les cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Authentication data cleared successfully',
      clearedCookies: cookieNames.length
    })

    // Nettoyer tous les cookies avec différentes configurations
    cookieNames.forEach(cookieName => {
      // Configuration de base
      response.cookies.set(cookieName, '', {
        path: '/',
        maxAge: -1,
        expires: new Date(0),
      })
      
      // Configuration pour production avec domaine
      if (process.env.NODE_ENV === 'production') {
        response.cookies.set(cookieName, '', {
          path: '/',
          maxAge: -1,
          expires: new Date(0),
          domain: '.ztvplus.site',
          secure: true,
          sameSite: 'lax'
        })
      }
    })

    // Ajouter des headers pour empêcher le cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')

    return response
  } catch (error) {
    console.error('Error cleaning auth data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clean authentication data' },
      { status: 500 }
    )
  }
}

// Supporter aussi GET pour le nettoyage via redirection
export async function GET() {
  return POST()
}
