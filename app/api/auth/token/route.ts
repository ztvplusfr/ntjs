import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retourner le token complet pour l'utiliser côté client
    return NextResponse.json({
      token: token,
      accessToken: token.accessToken,
      userId: token.sub
    })
  } catch (error) {
    console.error('Token API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
