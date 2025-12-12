import { NextRequest, NextResponse } from 'next/server'
import { signToken, setAuthCookie } from '@/lib/auth-jwt'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://ztvplus.site/api/auth/discord'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    // Redirect to Discord OAuth
    const discordUrl = new URL('https://discord.com/api/oauth2/authorize')
    discordUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
    discordUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI)
    discordUrl.searchParams.set('response_type', 'code')
    discordUrl.searchParams.set('scope', 'identify email')

    return NextResponse.redirect(discordUrl.toString())
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userData = await userResponse.json()

    const user = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email,
    }

    // Create JWT token
    const token = signToken(user)

    // Create response and set cookie
    const host = request.headers.get('host') || 'ztvplus.site'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const response = NextResponse.redirect(new URL(`${protocol}://${host}/browse`))
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Discord auth error:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}
