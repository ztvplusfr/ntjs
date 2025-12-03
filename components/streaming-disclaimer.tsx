'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

export default function StreamingDisclaimer() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Afficher l'avertissement après un court délai
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Ne pas afficher si pas encore visible
  if (!isVisible) {
    return null
  }

  return (
    <div className="w-full py-4 px-4 sm:py-6 sm:pl-6 lg:pl-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl bg-zinc-950 border border-red-500/60 shadow-xl">
          <div className="absolute inset-1 rounded-[calc(0.75rem)] border border-red-500/30 pointer-events-none"></div>
          {/* Lignes décoratives en arrière-plan */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          {/* Contenu principal */}
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-3 sm:gap-6">
              {/* Icône principale avec animation */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 blur-lg bg-red-600/40 rounded-full"></div>
                  <div className="relative w-11 h-11 sm:w-14 sm:h-14 bg-black border border-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
              
              {/* Contenu texte */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg sm:text-xl text-white mb-3">
                  Statut de disponibilité
                </h3>
                
                <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-3">
                  Certains contenus affichés proviennent de services externes et peuvent être temporairement indisponibles. Pour vérifier leur disponibilité, cliquez simplement dessus.
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
