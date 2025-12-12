import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = verifyToken(token)
    
    if (!payload?.user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: payload.user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
