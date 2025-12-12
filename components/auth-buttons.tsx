'use client'

import { useState } from 'react'
import { LogIn, LogOut, User, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'

export default function AuthButtons() {
  const { user, loading, signIn, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = () => {
    setIsLoading(true)
    signIn()
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white"></div>
      </div>
    )
  }

  if (user) {
    const avatarUrl = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5">
          <Image
            src={avatarUrl}
            alt={user.username}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-sm text-white hidden sm:inline">
            {user.username}
          </span>
        </div>
        
        <Link
          href="/profile"
          className="rounded-full bg-gray-800 p-2 text-white transition hover:bg-gray-700"
          title="Profil"
        >
          <User size={16} />
        </Link>
        
        <Link
          href="/settings"
          className="rounded-full bg-gray-800 p-2 text-white transition hover:bg-gray-700"
          title="Paramètres"
        >
          <Settings size={16} />
        </Link>
        
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:opacity-50"
          title="Se déconnecter"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <LogOut size={16} />
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      ) : (
        <LogIn size={16} />
      )}
      <span className="hidden sm:inline">Se connecter</span>
    </button>
  )
}
