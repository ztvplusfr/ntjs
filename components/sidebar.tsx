'use client'

import { Home, Search, User, LogOut, HeadphonesIcon, Settings, LayoutDashboard, Calendar } from 'lucide-react'
import { 
  IconBrandDiscord, 
  IconLogout
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import DiscordMessageModal from './discord-message-modal'
import SupportModal from './support-modal'
import packageInfo from '../package.json'

const sidebarItems = [
  { icon: Home, label: 'Home', href: '/browse' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HeadphonesIcon, label: 'Support', href: '#' }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isAuthorizedIP, setIsAuthorizedIP] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  
  // Vérifier si l'IP est autorisée (côté client uniquement)
  useEffect(() => {
    const checkAuthorization = () => {
      // Pour le développement, on peut utiliser des IPs de test
      const authorizedIPs = ['192.168.1.3', '165.169.45.189', '::1', '127.0.0.1']
      const clientIP = '::1' // En production, vous devriez obtenir l'IP réelle du client
      
      setIsAuthorizedIP(authorizedIPs.includes(clientIP))
    }
    
    checkAuthorization()
  }, [])

  // Charger la version depuis package.json
  useEffect(() => {
    if (packageInfo?.version) {
      setAppVersion(packageInfo.version)
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: '/' })
    setIsLoggingOut(false)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-black flex flex-col items-center py-8 justify-between z-50 border-r border-white/10">
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
                className={`group relative p-3 rounded-full transition-all duration-200 ${
                  'text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20'
                }`}
              >
                <Icon size={24} />
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
                  {item.label}
                </div>
              </button>
            )
          }
          
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
        {/* Profile photo */}
        {session?.user?.image ? (
          <Link href="/profile" className="relative group">
            <img
              src={session.user.image}
              alt={session.user.name || 'Profile'}
              className="w-10 h-10 rounded-full border-2 border-gray-700 group-hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
              title="Voir le profil"
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
              {session.user.name || 'Profil'}
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
        
        {/* Dashboard icon - visible only for authorized IPs */}
        {isAuthorizedIP && (
          <Link
            href="/admin/dashboard"
            className="group relative p-3 rounded-full transition-all duration-200 bg-green-500/20 border border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/30"
          >
            <LayoutDashboard size={24} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
              Tableau de bord
            </div>
          </Link>
        )}
        
        {/* Logout button (only when logged in) */}
        {session && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`group relative p-3 rounded-full transition-all duration-200 ${
              'text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20'
            }`}
          >
            <LogOut size={24} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
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
          href="https://discord.com/invite/WjedsPDts3"
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative p-3 rounded-full transition-all duration-200 ${
            'text-gray-400 hover:text-white hover:bg-black hover:border hover:border-white/20'
          }`}
        >
          <IconBrandDiscord size={24} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
            Rejoindre Discord
          </div>
        </Link>
        
        {/* App version */}
        <div className="text-center">
          <div className="text-xs text-gray-500 font-bold">
            App
          </div>
          <div className="text-xs text-gray-500 font-bold">
            v{appVersion || 'Loading...'}
          </div>  
        </div>
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
