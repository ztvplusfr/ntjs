'use client'

import { useRouter } from 'next/navigation'

// Translation function for language codes
const translateLanguage = (lang: string): string => {
  const translations: { [key: string]: string } = {
    'vf': 'Version Française',
    'vostfr': 'Version Originale Sous-titrée',
    'vo': 'Version Originale',
    'fr': 'Français',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'pt': 'Portugais',
    'nl': 'Néerlandais',
    'sv': 'Suédois',
    'no': 'Norvégien',
    'da': 'Danois',
    'fi': 'Finnois',
    'pl': 'Polonais',
    'tr': 'Turc',
    'ru': 'Russe',
    'ja': 'Japonais',
    'ko': 'Coréen',
    'zh': 'Chinois',
    'ar': 'Arabe',
    'hi': 'Hindi',
    'th': 'Thaï',
    'vi': 'Vietnamien'
  }
  return translations[lang.toLowerCase()] || lang.toUpperCase()
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
}

export default function VideoCard({ video, index, movieId, movieTitle }: VideoCardProps) {
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
    <div className="group cursor-pointer bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">{video.server}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-block px-2 py-1 text-xs rounded ${
            video.quality === 'HD' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}>
            {video.quality}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Langue:</span>
          <span className="text-white font-medium">{translateLanguage(video.lang)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Publicité:</span>
          <span className={`font-medium ${video.hasAds ? 'text-red-400' : 'text-green-400'}`}>
            {video.hasAds ? 'Oui' : 'Non'}
          </span>
        </div>
      </div>
      
      <button
        onClick={handleWatchNow}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span>{movieId ? 'Regarder' : 'Lire maintenant'}</span>
      </button>
    </div>
  )
}
