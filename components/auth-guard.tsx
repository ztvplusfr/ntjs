'use client'

import { useSession } from 'next-auth/react'
import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { memo, useMemo } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  message?: string
}

const AuthGuard = memo(function AuthGuard({ 
  children, 
  fallback,
  message = "Connectez-vous pour accéder au contenu en haute qualité." 
}: AuthGuardProps) {
  const { data: session, status } = useSession()

  const authState = useMemo(() => {
    const isAuthenticated = status === 'authenticated' && session
    const isLoading = status === 'loading'
    
    return { isAuthenticated, isLoading }
  }, [status, session])

  if (authState.isLoading) {
    return fallback || (
      <div className="bg-black border border-white/20 rounded-lg aspect-video flex items-center justify-center w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Vérification...</p>
        </div>
      </div>
    )
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="bg-black border border-white/20 rounded-lg aspect-video flex items-center justify-center w-full">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-black border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white/60" />
          </div>
          <h2 className="text-xl font-medium mb-2">Connexion requise</h2>
          <p className="text-gray-400 mb-6">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
})

AuthGuard.displayName = 'AuthGuard'

export default AuthGuard
