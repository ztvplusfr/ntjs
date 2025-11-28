import AuthButtons from './auth-buttons'
import Link from 'next/link'
import { 
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandSnapchat,
  IconBrandX
} from '@tabler/icons-react'

export default function Header() {
  return (
    <header className="w-full h-16 py-4 px-6 flex items-center justify-between relative z-40">
      <div className="flex-1 lg:hidden">
        {/* Espace vide à gauche sur mobile pour centrer le logo */}
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
        <AuthButtons />
      </div>
    </header>
  )
}
