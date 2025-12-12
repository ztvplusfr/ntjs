'use client'

import { useEffect } from 'react'

export default function DiscordAuthPage() {
  useEffect(() => {
    window.location.href = '/api/auth/discord'
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Redirection vers Discord...</p>
      </div>
    </div>
  )
}
