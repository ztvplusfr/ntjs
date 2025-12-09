'use client'

import { useState } from 'react'
import { IconBrandDiscord } from '@tabler/icons-react'

export default function DiscordInvite() {
  const [isHovered, setIsHovered] = useState(false)

  const handleJoinDiscord = () => {
    window.open('https://discord.com/invite/WjedsPDts3', '_blank')
  }

  return (
    <div className="relative bg-black">
      {/* Background layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      
      {/* Content */}
      <div className="relative py-6 px-4 sm:py-8 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-500/20 via-purple-600/10 to-blue-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-indigo-400/30 shadow-lg shadow-indigo-500/20">
            {/* Layout vertical sur mobile, horizontal sur desktop */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
              {/* Discord info - centre sur mobile, gauche sur desktop */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <IconBrandDiscord size={20} className="text-white sm:hidden" />
                    <IconBrandDiscord size={28} className="text-white hidden sm:block" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    Rejoignez notre{' '}
                    <span className="block sm:inline bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                      Communauté Discord
                    </span>
                  </h2>
                </div>
                
                <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6 px-2">
                  Discutez des derniers films, partagez vos recommandations et participez aux événements exclusifs !
                </p>
                
                {/* Features - grille sur mobile, ligne sur desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm justify-center lg:justify-start">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-center sm:text-left">Discussions en direct</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-center sm:text-left">Événements exclusifs</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-center sm:text-left">Recommandations</span>
                  </div>
                </div>
              </div>
              
              {/* CTA section - centre sur mobile, droite sur desktop */}
              <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 lg:mt-0">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">39</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70">Membres actifs</p>
                </div>
                
                <button
                  onClick={handleJoinDiscord}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25 group w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <IconBrandDiscord size={18} className="sm:hidden" />
                    <IconBrandDiscord size={20} className="hidden sm:block" />
                    <span className="text-sm sm:text-base">Rejoindre Discord</span>
                  </span>
                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl"></div>
                  )}
                </button>
                
                <p className="text-xs text-white/60 text-center max-w-[200px] px-4">
                  Rejoignez les premiers membres de notre communauté grandissante
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
