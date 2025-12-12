import type { Metadata } from 'next'
import Script from 'next/script'
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
    apple: '/favicon.png',
  },
  verification: {
    google: 'JoVfuBLfd6H-fd6wA8nGaf8eYKfkRV9gTkaFkftTmyE',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZTVPlus',
    startupImage: [
      {
        url: '/favicon.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ZTVPlus',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#000000',
    // Forcer les métadonnées PWA sur toutes les pages
    'application-name': 'ZTVPlus',
    'apple-touch-icon': '/favicon.png',
    'format-detection': 'telephone=no',
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
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="0766a5aa-c287-45de-ae85-353a3696e739"
        />
        <Script
          id="register-sw"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
