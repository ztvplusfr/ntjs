'use client'

import { useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'

const logTypes = ['error', 'warn', 'info']

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  const statusLabel = useMemo(() => {
    if (status === 'loading') return 'Chargement...'
    if (status === 'authenticated') return 'Connecté'
    return 'Non connecté'
  }, [status])

  useEffect(() => {
    logTypes.forEach((type) => {
      console[type](
        `[auth-test] status=${status} user=${session?.user?.name || 'N/A'} time=${new Date().toISOString()}`
      )
    })
  }, [status, session])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-inner shadow-sky-500/10 max-w-xl w-full space-y-4">
        <h1 className="text-3xl font-bold text-white">Vérification de session</h1>
        <p className="text-sm text-gray-300">La console affiche maintenant l’état du `useSession` à chaque changement.</p>
        <div className="rounded-2xl bg-black/60 border border-sky-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">statut</p>
          <p className="text-xl font-semibold text-sky-300">{statusLabel}</p>
        </div>
        <div className="rounded-2xl bg-black/60 border border-white/10 p-4 text-sm text-gray-200 space-y-2">
          <p>
            <span className="text-gray-400">User ID:</span> {session?.user?.id || '—'}
          </p>
          <p>
            <span className="text-gray-400">Email:</span> {session?.user?.email || '—'}
          </p>
          <p>
            <span className="text-gray-400">Nom:</span> {session?.user?.name || '—'}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Appelle `/logout` pour déclencher la déconnexion, puis revenez ici pour surveiller le changement.
        </p>
      </div>
    </div>
  )
}
