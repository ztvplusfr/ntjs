import type { Metadata } from 'next'
import './globals.css'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import Header from '@/components/header'
import PageLoader from '@/components/page-loader'
import ScrollToTop from '@/components/scroll-to-top'
import NavigationLoader from '@/components/navigation-loader'
import CookieMigrationProvider from '@/components/cookie-migration-provider'

import { Analytics } from '@vercel/analytics/next'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'ZTVPlus',
  description: 'Site de Streaming gratuit developpé par Hiro',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
  },
  verification: {
    google: 'JoVfuBLfd6H-fd6wA8nGaf8eYKfkRV9gTkaFkftTmyE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-black" suppressHydrationWarning={true}>
        <div id="app-content">
          <CookieMigrationProvider>
              <ScrollToTop />
              <PageLoader />
              <NavigationLoader />
              
              {/* Contenu principal */}
              <div>
                <Header />
                <main className="pb-20 lg:pb-0">
                  {children}
                </main>
              </div>
          </CookieMigrationProvider>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
