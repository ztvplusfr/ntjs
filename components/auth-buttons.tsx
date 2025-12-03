'use client'

import { useSession, signOut } from 'next-auth/react'
import { IconBrandDiscord, IconUser } from '@tabler/icons-react'
import Link from 'next/link'

export default function AuthButtons() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="w-32 h-10 bg-black border border-white/20 rounded-lg animate-pulse"></div>
    )
  }

  if (session) {
    return (
      <>
        {/* Profile avatar - visible on mobile left */}
        <div className="lg:hidden flex items-center">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-white/30"
            />
          ) : (
            <div className="w-8 h-8 bg-black border border-white/30 rounded-full flex items-center justify-center">
              <IconUser size={16} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Full user info and logout - visible on desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:bg-gray-900 px-3 py-2 rounded-lg transition-colors"
          >
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user?.name || 'User'}
                className="w-8 h-8 rounded-full border border-white/30"
              />
            )}
            <span className="text-white text-sm font-medium">
              {session.user?.name}
            </span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Déconnexion
          </button>
        </div>
        
        {/* Logout button - visible on mobile right */}
        <div className="lg:hidden">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white p-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Empty space on mobile left when not logged in */}
      <div className="lg:hidden"></div>
      
      {/* Login button - visible on desktop */}
      <div className="hidden lg:block">
        <Link 
          href="/auth/discord"
          className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          <IconBrandDiscord size={18} />
          <span className="ml-2">Connexion Discord</span>
        </Link>
      </div>
      
      {/* Login button - visible on mobile right */}
      <div className="lg:hidden">
        <Link 
          href="/auth/discord"
          className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
        >
          <IconBrandDiscord size={18} />
        </Link>
      </div>
    </>
  )
}
