import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
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
        url: '/icon-stranger-things.png',
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
      </head>
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
