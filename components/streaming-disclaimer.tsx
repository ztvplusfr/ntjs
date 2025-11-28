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
        <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gradient-to-r from-red-600/95 via-red-600/90 to-orange-600/90 backdrop-blur-sm border border-red-700/50">
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
                  <div className="absolute inset-0 bg-red-400/30 rounded-full animate-ping"></div>
                  <div className="relative w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                    <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Contenu texte */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="font-bold text-lg sm:text-xl text-white">
                    Information importante
                  </h3>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full self-start sm:self-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs text-white font-medium">Streaming</span>
                  </div>
                </div>
                
                <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4">
                  Tous les films et séries ajoutés à votre historique ne sont pas nécessairement disponibles en streaming. 
                  La disponibilité réelle sera confirmée lorsque vous cliquerez sur un contenu.
                </p>
                
                {/* Indicateurs visuels - grille sur mobile, ligne sur desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Vérification automatique au clic</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-3 h-3 border-2 border-white/60 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Disponibilité variable</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barre de progression animée */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-white/60 animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          {/* Barre d'information (non cliquable) */}
          <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-12 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-center pb-1 sm:pb-2">
            <div className="text-white/60 text-xs px-2 text-center">
              Information permanente sur la disponibilité des contenus
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
