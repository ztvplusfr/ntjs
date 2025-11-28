'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    const startLoading = () => {
      setIsLoading(true)
      setProgress(0)
      
      // Simuler une progression fluide
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 30
        })
      }, 100)
    }

    const completeLoading = () => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
        if (progressInterval) {
          clearInterval(progressInterval)
        }
      }, 200)
    }

    // Écouter les clics sur les liens
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && link.href !== window.location.href) {
        // Vérifier si c'est un lien interne
        const href = link.getAttribute('href')
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          e.preventDefault()
          startLoading()
          
          // Simuler une navigation rapide
          setTimeout(() => {
            if (href.startsWith('/')) {
              router.push(href)
            } else {
              window.location.href = href
            }
            completeLoading()
          }, 150)
        }
      }
    }

    document.addEventListener('click', handleLinkClick)

    return () => {
      document.removeEventListener('click', handleLinkClick)
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [pathname, router])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-800/50 backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
