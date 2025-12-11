'use client'

import { Video } from '@/app/watch/[movie-id]/client-page'

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
    window.location.href = `/watch/${movieId}?server=${videoIndex + 1}&quality=${video.quality}&language=${video.lang}&videoId=${video.id}`
  }

  return (
    <div
      className={`block p-3 rounded-lg border transition-all w-full cursor-pointer ${
        isSelected 
          ? 'bg-black border-white/50 shadow-lg' 
          : 'bg-black border-white/20 hover:border-white/30'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isSelected && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-white font-medium">EN COURS</span>
            </div>
          )}
          <div className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-white'}`}>
            {video.name}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`px-2 py-1 rounded-full text-xs border ${
          video.quality === '1080p' ? 'bg-black border-white/30 text-white' : 'bg-black border-white/20 text-white'
        }`}>
          {video.quality}
        </span>
        <span className="px-2 py-1 bg-black border border-white/20 rounded-full text-xs text-white">
          {translateLanguage(video.lang)}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs border ${
          video.pub === 1 ? 'bg-black border-white/20 text-white' : 'bg-black border-white/20 text-white'
        }`}>
          {video.pub === 1 ? 'Avec pub' : 'Sans pub'}
        </span>
      </div>
      {isSelected && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-white font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Lecture en cours
          </div>
          <div className="text-xs text-white/60">
            {video.quality} • {translateLanguage(video.lang)}
          </div>
        </div>
      )}
    </div>
  )
}
