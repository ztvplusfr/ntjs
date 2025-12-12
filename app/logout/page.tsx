'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      setIsLoggingOut(true)
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    handleLogout()
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {isLoggingOut ? (
          <>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Déconnexion en cours...</p>
          </>
        ) : (
          <>
            <p className="mb-4">Vous avez été déconnecté</p>
            <Link href="/" className="text-blue-400 hover:underline">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
