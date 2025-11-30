'use client'

import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'

// Translation function for language codes
const translateLanguage = (lang: string): string => {
  const translations: { [key: string]: string } = {
    'vf': '🇫🇷 Version Française',
    'vostfr': '🇫🇷 Version Originale Sous-titrée',
    'vo': '🌍 Version Originale',
    'fr': '🇫🇷 Français',
    'en': '🇬🇧 Anglais',
    'es': '🇪🇸 Espagnol',
    'de': '🇩🇪 Allemand',
    'it': '🇮🇹 Italien',
    'pt': '🇵🇹 Portugais',
    'nl': '🇳🇱 Néerlandais',
    'sv': '🇸🇪 Suédois',
    'no': '🇳🇴 Norvégien',
    'da': '🇩🇰 Danois',
    'fi': '🇫🇮 Finnois',
    'pl': '🇵🇱 Polonais',
    'tr': '🇹🇷 Turc',
    'ru': '🇷🇺 Russe',
    'ja': '🇯🇵 Japonais',
    'ko': '🇰🇷 Coréen',
    'zh': '🇨🇳 Chinois',
    'ar': '🇸🇦 Arabe',
    'hi': '🇮🇳 Hindi',
    'th': '🇹🇭 Thaï',
    'vi': '🇻🇳 Vietnamien'
  }
  return translations[lang.toLowerCase()] || `🌍 ${lang.toUpperCase()}`
}

interface VideoCardProps {
  video: {
    hasAds: boolean
    lang: string
    pub: number
    quality: string
    server: string
    url: string
  }
  index: number
  movieId?: string
  movieTitle?: string
  className?: string
  backdropUrl?: string  // Ajout de l'URL du backdrop
}

export default function VideoCard({ video, index, movieId, movieTitle, className, backdropUrl }: VideoCardProps) {
  const router = useRouter()

  const handleWatchNow = () => {
    if (movieId) {
      // Navigate to watch page with 1-based server index and new parameter names
      const watchUrl = `/watch/${movieId}?server=${index + 1}&quality=${video.quality}&language=${video.lang}`
      router.push(watchUrl)
    } else {
      // Fallback: open directly in new tab
      window.open(video.url, '_blank')
    }
  }

  return (
    <div 
      className={`group cursor-pointer bg-gray-900 rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors duration-300 ${className || ''}`}
      onClick={handleWatchNow}
    >
      {/* Thumbnail section */}
      <div className="relative aspect-video bg-gray-800">
        {/* Image backdrop du film */}
        {backdropUrl ? (
          <>
            <img
              src={backdropUrl}
              alt={`${movieTitle || video.server} backdrop`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-center justify-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </>
        ) : (
          // Fallback si pas de backdrop
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="text-white font-medium text-lg">{video.server}</p>
            </div>
          </div>
        )}
        
        {/* Badges en haut à droite - arrondis comme les cartes vidéos */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-xs text-white text-right whitespace-nowrap">
            {video.quality}
          </span>
          <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-xs text-white text-right whitespace-nowrap">
            {translateLanguage(video.lang)}
          </span>
        </div>
        
        {/* Badge pub en haut à gauche - arrondi */}
        {video.hasAds && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-600/40 rounded-full text-xs">
              Pub
            </span>
          </div>
        )}
      </div>
      
      {/* Info section */}
      <div className="p-4 bg-black">
        <h3 className="font-semibold text-white mb-2 line-clamp-1">{video.server}</h3>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className={video.hasAds ? 'text-red-400' : 'text-green-400'}>
            {video.hasAds ? 'Avec pub' : 'Sans pub'}
          </span>
          <span className="text-right">{video.quality} • {translateLanguage(video.lang)}</span>
        </div>
      </div>
    </div>
  )
}
