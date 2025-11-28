'use client'

import { Video } from '@/app/watch/[movie-id]/page'

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

interface VideoSourceCardProps {
  video: Video
  isSelected: boolean
  movieId: string
  videoIndex: number
}

export default function VideoSourceCard({ video, isSelected, movieId, videoIndex }: VideoSourceCardProps) {
  const handleClick = () => {
    window.location.href = `/watch/${movieId}?server=${videoIndex + 1}&quality=${video.quality}&language=${video.lang}`
  }

  return (
    <div
      className={`block p-3 rounded-lg border transition-all w-full cursor-pointer ${
        isSelected 
          ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-500/20' 
          : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isSelected && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-red-400 font-medium">EN COURS</span>
            </div>
          )}
          <div className={`font-medium text-sm ${isSelected ? 'text-red-400' : 'text-white'}`}>
            {video.name}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`px-2 py-1 rounded text-xs ${
          video.quality === '1080p' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}>
          {video.quality}
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
          {translateLanguage(video.lang)}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${
          video.pub === 1 ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
        }`}>
          {video.pub === 1 ? 'Ads' : 'No Ads'}
        </span>
      </div>
      {isSelected && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-red-400 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Lecture en cours
          </div>
          <div className="text-xs text-gray-400">
            {video.quality} • {translateLanguage(video.lang)}
          </div>
        </div>
      )}
    </div>
  )
}
