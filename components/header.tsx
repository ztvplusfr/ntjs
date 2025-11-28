import AuthButtons from './auth-buttons'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="w-full h-16 py-4 px-6 flex items-center justify-between relative z-40">
      <div className="flex-1 lg:hidden">
        {/* Espace vide à gauche sur mobile pour centrer le logo */}
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
        <Link href="/">
          <img 
            src="/image.png" 
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
