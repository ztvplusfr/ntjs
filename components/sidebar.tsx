'use client'

import { Home, Search, User, LogOut, HeadphonesIcon } from 'lucide-react'
import { IconBrandDiscord } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import DiscordMessageModal from './discord-message-modal'
import SupportModal from './support-modal'

const sidebarItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: HeadphonesIcon, label: 'Support', href: '/chat' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: '/' })
    setIsLoggingOut(false)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-black flex flex-col items-center py-8 justify-between z-50">
      <div className="flex flex-col items-center space-y-8">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          // Special handling for Support item
          if (item.label === 'Support') {
            return (
              <button
                key="support"
                onClick={() => setIsSupportModalOpen(true)}
                className={`group relative p-3 rounded-lg transition-all duration-200 ${
                  'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={24} />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {item.label}
                </div>
              </button>
            )
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={24} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Profile photo */}
        {session?.user?.image ? (
          <div className="relative group">
            <img
              src={session.user.image}
              alt={session.user.name || 'Profile'}
              className="w-10 h-10 rounded-full border-2 border-gray-700 group-hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
              onClick={handleLogout}
              title="Se déconnecter"
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {session.user.name || 'Profil'} (cliquer pour déconnexion)
            </div>
            {isLoggingOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
              <User size={20} />
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Non connecté
            </div>
          </div>
        )}
        
        {/* Logout button (only when logged in) */}
        {session && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group relative p-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Se déconnecter"
          >
            <LogOut size={24} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Déconnexion
            </div>
            {isLoggingOut && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              </div>
            )}
          </button>
        )}
        
        {/* Discord icon */}
        <Link
          href="/discord"
          className={`group relative p-3 rounded-lg transition-all duration-200 ${
            pathname === '/discord' 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <IconBrandDiscord size={24} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Discord
          </div>
        </Link>
      </div>
      
      <DiscordMessageModal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
      />
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </div>
  )
}
