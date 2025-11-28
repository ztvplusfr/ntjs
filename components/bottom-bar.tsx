'use client'

import { Home, Search, User, LogOut, HeadphonesIcon, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import SupportModal from './support-modal'

const bottomBarItems = [
  { icon: Home, label: 'Home', href: '/browse' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function BottomBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: '/' })
    setIsLoggingOut(false)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 z-50 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {bottomBarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-sky-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Support icon */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-sky-500"
          >
            <HeadphonesIcon size={20} />
            <span className="text-xs mt-1">Support</span>
          </button>
          
          {/* Profile/Logout */}
          {session ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
              ) : (
                <>
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Profile'}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <User size={20} />
                  )}
                  <span className="text-xs mt-1">Profile</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col items-center p-2 rounded-lg text-gray-400">
              <User size={20} />
              <span className="text-xs mt-1">Profil</span>
            </div>
          )}
        </div>
      </div>
      
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </>
  )
}
