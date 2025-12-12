import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    const payload = verifyToken(token)
    
    if (!payload?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ 
      user: payload.user,
      valid: true 
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 })
  }
}
