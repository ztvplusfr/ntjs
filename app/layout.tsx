import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/sidebar'
import BottomBar from '@/components/bottom-bar'
import Header from '@/components/header'
import SessionProviderWrapper from '@/components/session-provider'
import NavigationLoader from '@/components/navigation-loader'
import CookieMigrationProvider from '@/components/cookie-migration-provider'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'ZTVPlus',
  description: 'Site de Streaming gratuit developpé par Hiro',
  icons: {
    icon: '/icon-stranger-things.png',
    shortcut: '/icon-stranger-things.png',
    apple: '/icon-stranger-things.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black">
        <CookieMigrationProvider>
          <SessionProviderWrapper>
            <NavigationLoader />
            {/* Sidebar - cachée sur mobile */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            
            {/* Contenu principal */}
            <div className="lg:ml-20">
              <Header />
              <main className="pb-16 lg:pb-0">
                {children}
              </main>
            </div>
            
            {/* Bottom bar - visible uniquement sur mobile */}
            <BottomBar />
          </SessionProviderWrapper>
        </CookieMigrationProvider>
        <Analytics />
      </body>
    </html>
  )
}