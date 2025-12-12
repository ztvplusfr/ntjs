import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    // Récupérer la session pour obtenir le token Discord
    const session = await getServerSession(authOptions)
    
    // Révoquer le token Discord si disponible
    if (session?.user?.accessToken) {
      try {
        await fetch('https://discord.com/api/oauth2/token/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: session.user.accessToken,
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
          }),
        })
      } catch (discordError) {
        console.error('Error revoking Discord token:', discordError)
      }
    }

    // Liste complète des cookies NextAuth et autres cookies d'authentification
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Host-next-auth.callback-url',
      // Ajouter d'autres cookies potentiels
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
      clearedCookies: cookieNames.length,
      discordTokenRevoked: !!session?.user?.accessToken
    })

    // Nettoyer tous les cookies avec différentes configurations pour s'assurer qu'ils sont supprimés
    cookieNames.forEach(cookieName => {
      // Utiliser la syntaxe correcte pour supprimer les cookies
      response.cookies.set(cookieName, '', {
        path: '/',
        maxAge: -1,
        expires: new Date(0),
      })
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
