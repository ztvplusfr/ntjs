import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const COOKIE_NAME = 'auth-token'

export interface User {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string | null
}

export interface JWTPayload {
  user: User
  iat: number
  exp: number
}

export function signToken(user: User): string {
  return jwt.sign(
    { user },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })
}

export function getAuthCookie(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthCookie()
  if (!token) return null
  
  const payload = verifyToken(token)
  return payload?.user || null
}
