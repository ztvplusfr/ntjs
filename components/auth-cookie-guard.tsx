'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { readAuthFlag, writeAuthFlag } from '@/lib/auth-flag'

export default function AuthCookieGuard() {
  const { data: session } = useSession()
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3 // Nombre de tentatives avant déconnexion

  useEffect(() => {
    if (session) {
      writeAuthFlag(true)
      setRetryCount(0) // Réinitialiser le compteur à chaque mise à jour de session
    }
  }, [session])

  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      const isFlagPresent = readAuthFlag()
      
      if (!isFlagPresent) {
        setRetryCount(prev => {
          const newCount = prev + 1
          
          // Se déconnecter uniquement après plusieurs échecs consécutifs
          if (newCount >= MAX_RETRIES) {
            console.warn('Auth flag missing, signing out...')
            signOut({ redirect: false })
            return 0
          }
          
          // Réessayer de réécrire le flag
          writeAuthFlag(true)
          return newCount
        })
      } else {
        // Réinitialiser le compteur si le flag est présent
        if (retryCount > 0) {
          setRetryCount(0)
        }
      }
    }, 2000) // Vérifier toutes les 2 secondes au lieu de 1

    return () => clearInterval(interval)
  }, [session, retryCount])

  return null
}
