'use client'

import AuthButtons from './auth-buttons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconSearch,
  IconDeviceTv,
  IconMovie,
  IconCalendar,
  IconMessage,
  IconSettings,
  IconBrandDiscord,
  IconUser,
  IconLogout,
} from '@tabler/icons-react'
import NoSSR from './no-ssr'
import { useAuth } from '@/hooks/use-auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const navigationItems = [
  { href: '/browse', icon: IconHome, label: 'Accueil' },
  { href: '/search', icon: IconSearch, label: 'Recherche' },
  { href: '/agenda', icon: IconCalendar, label: 'Agenda' },
  { href: 'https://discord.com/invite/WjedsPDts3', icon: IconBrandDiscord, label: 'Discord' },
  { href: '/settings', icon: IconSettings, label: 'Paramètres' },
]

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const userImage = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null
  const userName = user?.username || 'Utilisateur'
  
  const isSearchPage = pathname === '/search'

  return (
    <>
      <header className={`w-full p-2 lg:p-4 ${isSearchPage ? 'relative' : 'sticky top-0'} z-50 bg-transparent`}>
        <div className="flex items-center gap-2 lg:gap-4 bg-black rounded-xl lg:rounded-2xl px-3 lg:px-6 py-2 lg:py-4 border border-white/10">
          {/* Left Section - Logo */}
          <div className="flex-1 flex items-center">
            <Link href="/browse" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="ZTVPlus" 
                className="h-8 lg:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Center Section - Navigation Desktop */}
          <nav className="flex-1 hidden lg:flex items-center justify-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isExternal = item.href.startsWith('http')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Section - User Actions */}
          <div className="flex-1 flex items-center justify-end gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Profile */}
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={userName}
                      className="w-8 h-8 rounded-full border border-gray-600"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <IconUser size={16} className="text-gray-300" />
                    </div>
                  )}
                  <span className="text-sm text-white hidden sm:inline">{userName}</span>
                </Link>

                {/* Discord Link */}
                <Link
                  href="https://discord.com/invite/WjedsPDts3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Rejoindre Discord"
                >
                  <IconBrandDiscord size={20} />
                </Link>

                {/* Logout */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Se déconnecter"
                    >
                      <IconLogout size={20} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder au contenu.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await fetch('/api/clean-auth', { method: 'POST' })
                            await signOut()
                          } catch (error) {
                            console.error('Failed to sign out:', error)
                            window.location.replace('/')
                          }
                        }}
                      >
                        Se déconnecter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <NoSSR fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white"></div>}>
                <AuthButtons />
              </NoSSR>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {navigationItems.filter(item => 
            item.label === 'Accueil' || 
            item.label === 'Recherche' || 
            item.label === 'Agenda' || 
            item.label === 'Discord'
          ).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isExternal = item.href.startsWith('http')

            return (
              <Link
                key={item.href}
                href={item.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
