import { NextResponse } from 'next/server'

const COOKIE_NAMES = [
  'next-auth.session-token',
  'next-auth.csrf-token',
  '__Secure-next-auth.session-token',
  '__Secure-next-auth.csrf-token',
  '__Host-next-auth.session-token',
  '__Host-next-auth.csrf-token',
  'next-auth.callback-url',
]

export async function POST() {
  const response = NextResponse.json({ success: true })

  COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: -1,
      expires: new Date(0),
    })
  })

  return response
}
