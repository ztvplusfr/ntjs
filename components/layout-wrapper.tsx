'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import BottomBar from '@/components/bottom-bar'
import Header from '@/components/header'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  return (
    <>
      {/* Sidebar - cachée sur mobile et sur la page d'accueil */}
      {!isHomePage && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}
      
      {/* Contenu principal */}
      <div className={isHomePage ? '' : 'lg:ml-20'}>
        {!isHomePage && <Header />}
        <main className={isHomePage ? '' : 'pb-16 lg:pb-0'}>
          {children}
        </main>
      </div>
      
      {/* Bottom bar - visible uniquement sur mobile et pas sur la page d'accueil */}
      {!isHomePage && <BottomBar />}
    </>
  )
}
