'use client'

import AuthButtons from './auth-buttons'
import Link from 'next/link'
import { 
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandSnapchat,
  IconBrandX,
  IconBrandDiscord
} from '@tabler/icons-react'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="w-full h-16 py-4 px-6 flex items-center justify-between relative z-40">
      {/* Profile avatar on mobile left */}
      <div className="flex-1 lg:hidden">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user?.name || 'User'}
            className="w-8 h-8 rounded-full border border-white/30"
          />
        ) : (
          <div className="w-8 h-8 bg-black border border-white/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="hidden lg:flex items-center gap-4">
        <Link href="/">
          <img 
            src="/logo-stranger-things.png" 
            alt="ZTVPlus" 
            className="h-8 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
        
        <span className="text-gray-400 text-sm">|</span>
        
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com/ztvplusfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-pink-500 transition-colors"
            title="Instagram @ztvplusfr"
          >
            <IconBrandInstagram size={20} />
          </a>
          <a
            href="https://tiktok.com/@ztvplusfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            title="TikTok @ztvplusfr"
          >
            <IconBrandTiktok size={20} />
          </a>
          <a
            href="https://snapchat.com/add/ztvplusfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-500 transition-colors"
            title="Snapchat @ztvplusfr"
          >
            <IconBrandSnapchat size={20} />
          </a>
          <a
            href="https://x.com/ztvplusfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-sky-500 transition-colors"
            title="X/Twitter @ztvplusfr"
          >
            <IconBrandX size={20} />
          </a>
        </div>
      </div>
      
      {/* Mobile: Logo centré */}
      <div className="absolute left-1/2 transform -translate-x-1/2 lg:hidden">
        <Link href="/">
          <img 
            src="/logo-stranger-things.png" 
            alt="ZTVPlus" 
            className="h-8 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
      </div>
      
      <div className="flex-1 flex justify-end relative z-50">
        {/* Only show login/logout button on mobile right */}
        <div className="lg:hidden">
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white p-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          ) : (
            <Link 
              href="/auth/discord"
              className="bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <IconBrandDiscord size={18} />
            </Link>
          )}
        </div>
        
        {/* Full AuthButtons on desktop */}
        <div className="hidden lg:block">
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}
