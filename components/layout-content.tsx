'use client'

import { usePathnameContext } from './pathname-provider'
import Sidebar from '@/components/sidebar'
import BottomBar from '@/components/bottom-bar'
import Header from '@/components/header'
import SessionProviderWrapper from '@/components/session-provider'
import NavigationLoader from '@/components/navigation-loader'
import CookieMigrationProvider from '@/components/cookie-migration-provider'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isHomePage } = usePathnameContext()
  
  return (
    <CookieMigrationProvider>
      <SessionProviderWrapper>
        <NavigationLoader />
        {/* Sidebar - cachée sur mobile et sur la page d'accueil */}
        {!isHomePage && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        
        {/* Contenu principal */}
        <div className={isHomePage ? '' : 'lg:ml-20'}>
          {!isHomePage && <Header />}
          <main className={isHomePage ? '' : 'pb-main-safe lg:pb-0'}>
            {children}
          </main>
        </div>
        
        {/* Bottom bar - visible uniquement sur mobile et pas sur la page d'accueil */}
        {!isHomePage && <BottomBar />}
      </SessionProviderWrapper>
    </CookieMigrationProvider>
  )
}
