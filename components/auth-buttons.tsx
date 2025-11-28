'use client'

import { useSession, signOut } from 'next-auth/react'
import { IconBrandDiscord, IconBrandSnapchat } from '@tabler/icons-react'
import Link from 'next/link'

export default function AuthButtons() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="w-32 h-10 bg-gray-800 rounded-lg animate-pulse"></div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        {/* Info utilisateur cachée sur mobile */}
        <div className="hidden sm:flex items-center gap-2">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-gray-600"
            />
          )}
          <span className="text-white text-sm font-medium">
            {session.user?.name}
          </span>
        </div>
        
        {/* Bouton déconnexion - icône seule sur mobile */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm font-medium transition-colors sm:px-4 sm:py-2"
        >
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link 
        href="/auth/discord"
        className="bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white p-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center relative z-50 cursor-pointer sm:px-4 sm:py-2"
        style={{ pointerEvents: 'auto' }}
      >
        <IconBrandDiscord size={18} />
        <span className="hidden sm:inline ml-2">Discord</span>
      </Link>
      
      <Link 
        href="/auth/snapchat"
        className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black p-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center relative z-50 cursor-pointer sm:px-4 sm:py-2"
        style={{ pointerEvents: 'auto' }}
      >
        <IconBrandSnapchat size={18} />
        <span className="hidden sm:inline ml-2">Snapchat</span>
      </Link>
    </div>
  )
}
