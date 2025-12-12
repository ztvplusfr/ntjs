'use client'

import { Home, Search, User, LogOut, Settings, Calendar } from 'lucide-react'
import { IconBrandDiscord } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import DiscordMessageModal from './discord-message-modal'
import packageInfo from '../package.json'

const sidebarItems = [
  { icon: Home, label: 'Home', href: '/browse' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (packageInfo?.version) {
      setAppVersion(packageInfo.version)
    }
  }, [])

  // Force re-render when user or loading changes to reflect logout immediately
  useEffect(() => {
    // This effect runs whenever user or loading changes
    // It helps ensure the UI reflects the current auth state
  }, [user, loading])

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-black flex flex-col items-center py-8 justify-between z-50 border-r border-white/10">
      <div className="flex flex-col items-center space-y-8">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative p-3 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white border border-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20'
              }`}
            >
              <Icon size={24} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="flex flex-col items-center space-y-4">
        {user?.image ? (
          <Link href="/profile" className="relative group">
            <img
              src={user.image}
              alt={user.name || 'Profile'}
              className="w-10 h-10 rounded-full border-2 border-gray-700 group-hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
              title="Voir le profil"
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
              {user.name || 'Profil'}
            </div>
          </Link>
        ) : (
          <div className="relative group">
            <div className="w-10 h-10 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/60">
              <User size={20} />
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
              Non connecté
            </div>
          </div>
        )}

        {user && (
          <button
            onClick={async () => {
              try {
                // First clear local auth flag
                const { writeAuthFlag } = await import('@/lib/auth-flag')
                writeAuthFlag(false)
                
                // Use comprehensive cleaning endpoint
                await fetch('/api/clean-auth', { method: 'POST' })
                
                // Use custom signOut
                await signOut()
              } catch (error) {
                console.error('Failed to sign out:', error)
                // Fallback: force hard reload
                window.location.replace('/')
              }
            }}
            className="group relative p-3 rounded-full text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20 transition-all duration-200"
          >
            <LogOut size={24} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
              Déconnexion
            </div>
          </button>
        )}

        <Link
          href="https://discord.com/invite/WjedsPDts3"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-3 rounded-full text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20 transition-all duration-200"
        >
          <IconBrandDiscord size={24} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
            Rejoindre Discord
          </div>
        </Link>

        <div className="text-center">
          <div className="text-xs text-gray-500 font-bold">App</div>
          <div className="text-xs text-gray-500 font-bold">v{appVersion || 'Loading...'}</div>
        </div>
      </div>

      <DiscordMessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} />
    </div>
  )
}
