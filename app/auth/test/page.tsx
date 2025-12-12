'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'

export default function AuthTestPage() {
  const { user, loading } = useAuth()
  const [membershipStatus, setMembershipStatus] = useState<boolean | null>(null)

  useEffect(() => {
    if (user) {
      fetch('/api/discord/verify-membership')
        .then(res => res.json())
        .then(data => setMembershipStatus(data.isMember))
        .catch(() => setMembershipStatus(false))
    }
  }, [user])

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Test d'authentification</h1>
      
      {user ? (
        <div className="space-y-4">
          <p>✅ Connecté en tant que: {user.username}</p>
          <p>ID: {user.id}</p>
          <p>Email: {user.email}</p>
          <p>Membre du serveur: {membershipStatus === null ? 'Vérification...' : membershipStatus ? '✅ Oui' : '❌ Non'}</p>
        </div>
      ) : (
        <div>
          <p>❌ Non connecté</p>
          <a href="/api/auth/discord" className="text-blue-400 hover:underline">Se connecter</a>
        </div>
      )}
    </div>
  )
}
