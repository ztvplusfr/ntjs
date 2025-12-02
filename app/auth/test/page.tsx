'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Chargement...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test d'authentification Discord</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">État de la session</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session:</strong> {session ? 'Connecté' : 'Non connecté'}</p>
            {session && (
              <div className="mt-4 p-4 bg-gray-800 rounded">
                <p><strong>User ID:</strong> {session.user?.id}</p>
                <p><strong>Name:</strong> {session.user?.name}</p>
                <p><strong>Email:</strong> {session.user?.email || 'Non disponible'}</p>
                <p><strong>Avatar:</strong> {session.user?.image}</p>
                <p><strong>Access Token:</strong> {session.user?.accessToken ? 'Présent' : 'Absent'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Variables d'environnement</h2>
            <div className="space-y-2 text-sm">
              <p><strong>NEXTAUTH_URL:</strong> {typeof window !== 'undefined' ? 'Défini' : 'Non défini'}</p>
              <p><strong>DISCORD_CLIENT_ID:</strong> {process.env.DISCORD_CLIENT_ID ? 'Défini' : 'Non défini'}</p>
              <p><strong>DISCORD_CLIENT_SECRET:</strong> {process.env.DISCORD_CLIENT_SECRET ? 'Défini' : 'Non défini'}</p>
              <p><strong>DISCORD_GUILD_ID:</strong> {process.env.DISCORD_GUILD_ID ? 'Défini' : 'Non défini'}</p>
              <p><strong>DISCORD_BOT_TOKEN:</strong> {process.env.DISCORD_BOT_TOKEN ? 'Défini' : 'Non défini'}</p>
              <p><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? 'Défini' : 'Non défini'}</p>
            </div>
          </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button
            onClick={() => signIn('discord')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Se connecter avec Discord
          </button>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions de configuration Discord</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Configuration de l'application Discord</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Allez sur https://discord.com/developers/applications</li>
                <li>Sélectionnez votre application</li>
                <li>Allez dans "OAuth2" → "General"</li>
                <li>Ajoutez ce redirect URI: <code className="bg-gray-800 px-2 py-1 rounded">http://192.168.1.3:3000/api/auth/callback/discord</code></li>
                <li>Vérifiez que les scopes incluent: <code className="bg-gray-800 px-2 py-1 rounded">identify</code> et <code className="bg-gray-800 px-2 py-1 rounded">guilds</code></li>
                <li>Définissez <code className="bg-gray-800 px-2 py-1 rounded">DISCORD_GUILD_ID</code> avec l'ID de votre serveur Discord principal</li>
                <li>Définissez <code className="bg-gray-800 px-2 py-1 rounded">DISCORD_BOT_TOKEN</code> (bot avec le scope <code className="bg-gray-800 px-2 py-1 rounded">GUILD_MEMBERS</code> si besoin)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Redémarrez le serveur</h3>
              <p className="text-gray-300">Après avoir modifié .env.local, arrêtez et redémarrez votre serveur de développement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
