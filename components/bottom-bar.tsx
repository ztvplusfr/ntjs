'use client'

import { Home, Search, Calendar, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const bottomBarItems = [
  { icon: Home, label: 'Home', href: '/browse' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

interface BottomBarProps {
  hidden?: boolean
}

export default function BottomBar({ hidden = false }: BottomBarProps) {
  const pathname = usePathname()

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 z-50 lg:hidden ${hidden ? 'hidden' : ''}`}>
      <div className="flex items-center justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
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
      </div>
    </div>
  )
}
