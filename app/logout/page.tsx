'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { writeAuthFlag } from '@/lib/auth-flag'

export default function LogoutPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const router = useRouter()

  const performLogout = async () => {
    setStatus('loading')

    try {
      // Clear local auth flag
      writeAuthFlag(false)
      
      // Use comprehensive cleaning endpoint
      await fetch('/api/clean-auth', { method: 'POST' })
      
      // Use NextAuth signOut with redirect to ensure complete cleanup
      await signOut({ 
        redirect: true, 
        callbackUrl: '/' 
      })
    } catch (error) {
      console.error('Logout failed', error)
      setStatus('error')
    }
  }

  useEffect(() => {
    performLogout()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 to-slate-900/70 p-8 text-center shadow-2xl shadow-cyan-500/10">
        <h1 className="text-3xl font-bold">Déconnexion</h1>
        {status === 'loading' && (
          <p className="text-sm text-gray-400">
            Vous êtes en train de vous déconnecter...
          </p>
        )}
        {status === 'success' && (
          <p className="text-sm text-gray-300">
            Vous êtes déconnecté. Redirection vers l'accueil.
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500">
            Une erreur est survenue lors de la déconnexion.{' '}
            <button
              type="button"
              onClick={performLogout}
              className="text-sky-400 underline"
            >
              Réessayer
            </button>
          </p>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
