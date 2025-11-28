'use client'

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'

export default function DiscordAuthPage() {
  useEffect(() => {
    // Rediriger directement vers Discord
    signIn('discord', { callbackUrl: '/' })
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-lg">Redirection vers Discord...</p>
      </div>
    </div>
  )
}
