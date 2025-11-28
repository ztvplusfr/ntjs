'use client'

import { useEffect } from 'react'
import { cookieUtils } from '@/lib/cookies'

export default function CookieMigrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Migrer les données depuis localStorage vers les cookies au premier chargement
    if (typeof window !== 'undefined') {
      cookieUtils.migrateFromLocalStorage()
    }
  }, [])

  return <>{children}</>
}
