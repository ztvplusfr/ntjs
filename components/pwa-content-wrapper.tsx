'use client'

import { useEffect, useState } from 'react'

interface PWAContentWrapperProps {
  children: React.ReactNode
}

export default function PWAContentWrapper({ children }: PWAContentWrapperProps) {
  const [showContent, setShowContent] = useState(false) // Commencer masqué
  const [isPWA, setIsPWA] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Détecter si l'app est en mode PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches
      
      return isStandalone || isInWebAppiOS || isInWebAppChrome
    }

    const isPWAMode = checkPWA()
    setIsPWA(isPWAMode)
    setIsInitialized(true)

    if (isPWAMode) {
      // En PWA, garder le contenu masqué pendant le splash screen
      setShowContent(false)
      
      // Afficher le contenu après le splash screen (2.8 secondes)
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 2800)

      return () => clearTimeout(timer)
    } else {
      // En mode navigateur normal, afficher immédiatement
      setShowContent(true)
    }
  }, [])

  // Attendre l'initialisation pour éviter le flash
  if (!isInitialized) {
    return null
  }

  // En mode PWA, masquer le contenu pendant le splash
  if (isPWA && !showContent) {
    return null
  }

  return <>{children}</>
}