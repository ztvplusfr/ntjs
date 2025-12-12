'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { APP_VERSION } from '@/lib/version'

export default function PWASplashScreen() {
  const [showSplash, setShowSplash] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [platform, setPlatform] = useState('')

  useEffect(() => {
    // Détecter la plateforme
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'iOS'
      } else if (/android/.test(userAgent)) {
        return 'Android'
      } else if (/macintosh|mac os x/.test(userAgent)) {
        return 'macOS'
      } else if (/windows/.test(userAgent)) {
        return 'Windows'
      } else if (/linux/.test(userAgent)) {
        return 'Linux'
      } else {
        return 'Web'
      }
    }

    // Détecter si l'app est en mode PWA immédiatement
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches
      
      return isStandalone || isInWebAppiOS || isInWebAppChrome
    }

    const detectedPlatform = detectPlatform()
    const isPWAMode = checkPWA()
    
    setPlatform(detectedPlatform)
    setIsPWA(isPWAMode)
    setIsInitialized(true)

    if (isPWAMode) {
      // Afficher immédiatement le splash en PWA
      setShowSplash(true)
      
      // Commencer l'animation de sortie après 2 secondes
      const hideTimer = setTimeout(() => {
        setIsHiding(true)
      }, 2000)

      // Masquer complètement le splash après l'animation
      const removeTimer = setTimeout(() => {
        setShowSplash(false)
      }, 2800) // 2000ms + 800ms d'animation

      return () => {
        clearTimeout(hideTimer)
        clearTimeout(removeTimer)
      }
    }
  }, [])

  // Attendre l'initialisation
  if (!isInitialized) {
    // En attendant, afficher un écran noir en PWA potentiel
    return <div className="fixed inset-0 z-[9999] bg-black" />
  }

  if (!isPWA || !showSplash) {
    return null
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-800 ${
      isHiding ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Logo centré */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`transition-all duration-500 ${
          isHiding ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
        }`}>
          <Image
            src="/favicon.png"
            alt="ZTVPlus"
            width={120}
            height={120}
            className="w-30 h-30 object-contain"
            priority
          />
        </div>
      </div>

      {/* Version et barre de chargement en bas */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4">
        {/* Version */}
        <div className="text-gray-400 text-sm font-medium">
          {platform} v{APP_VERSION}
        </div>
        
        {/* Barre de chargement */}
        <div className="w-64">
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full animate-pulse"
              style={{
                width: '100%',
                animation: 'loading 2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}