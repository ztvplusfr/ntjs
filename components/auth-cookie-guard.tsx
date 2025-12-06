'use client'

import { useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { readAuthFlag, writeAuthFlag } from '@/lib/auth-flag'

export default function AuthCookieGuard() {
  const { data: session } = useSession()

  useEffect(() => {
    writeAuthFlag(Boolean(session))
  }, [session])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!readAuthFlag() && session) {
        signOut({ redirect: false })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [session])

  return null
}
