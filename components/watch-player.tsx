"use client"

import { useState, useEffect } from 'react'

interface Video {
  id: string
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
}

interface WatchPlayerProps {
  video: Video
  movie: any
  allVideos: Video[]
}

// Translation function with flags for language codes
const translateLanguageWithFlag = (lang: string): string => {
  const translations: { [key: string]: string } = {
    'vf': '🇫🇷 VF',
    'vostfr': '🇫🇷 VOSTFR',
    'vo': '🌍 VO',
    'fr': '🇫🇷 FR',
    'en': '🇬🇧 EN',
    'es': '🇪🇸 ES',
    'de': '🇩🇪 DE',
    'it': '🇮🇹 IT',
    'pt': '🇵🇹 PT',
    'nl': '🇳🇱 NL',
    'sv': '🇸🇪 SV',
    'no': '🇳🇴 NO',
    'da': '🇩🇰 DA',
    'fi': '🇫🇮 FI',
    'pl': '🇵🇱 PL',
    'tr': '🇹🇷 TR',
    'ru': '🇷🇺 RU',
    'ja': '🇯🇵 JP',
    'ko': '🇰🇷 KR',
    'zh': '🇨🇳 CN',
    'ar': '🇸🇦 AR',
    'hi': '🇮🇳 HI',
    'th': '🇹🇭 TH',
    'vi': '🇻🇳 VN'
  }
  return translations[lang.toLowerCase()] || `🌍 ${lang.toUpperCase()}`
}

export default function WatchPlayer({ video, movie, allVideos }: WatchPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string>('')
  useEffect(() => {
    if (video.play === 1) {
      setIsLoading(false)
      setError(null)
    }
  }, [video.play])

  // Generate embed URL based on video URL
  const getEmbedUrl = (url: string) => {
    // Handle different video providers
    if (url.includes('vidhideplus.com') || url.includes('doodstream')) {
      // For these providers, use the direct URL in iframe
      return url
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube embed
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url
    } else if (url.includes('vimeo.com')) {
      // Vimeo embed
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url
    }
    
    // Default: use direct URL
    return url
  }

  // Preload the embed URL immediately
  useEffect(() => {
    const url = getEmbedUrl(video.url)
    setEmbedUrl(url)
    
    // Preload the iframe to reduce loading time
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'document'
    link.href = url
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [video.url])

  const handleLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleError = () => {
    setError('Impossible de charger la vidéo. Veuillez réessayer avec une autre source.')
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden border border-white/20" style={{ aspectRatio: '16/9' }}
           onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
           onCopy={(e: React.ClipboardEvent) => e.preventDefault()}
           onCut={(e: React.ClipboardEvent) => e.preventDefault()}
           onPaste={(e: React.ClipboardEvent) => e.preventDefault()}
      >
        {/* Loading State - Minimal for faster loading */}
        {isLoading && video.play !== 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Video Player - Native or iframe based on play flag */}
        {embedUrl && (
          <>
            {video.play === 1 ? (
              <video
                key={video.url}
                controls
                className="w-full h-full"
                preload="metadata"
                onLoadedData={handleLoad}
                onError={handleError}
              >
                <source src={video.url} type="application/x-mpegURL" />
                <source src={video.url} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              // Iframe player for play: 0
              <iframe
                src={embedUrl}
                className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                onLoad={handleLoad}
                onError={handleError}
                loading="eager"
                title={`Regarder ${movie.title} en streaming`}
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </>
        )}
      </div>

      {/* Video Info Bar - Modern design */}
      <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="font-medium text-white">{video.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-xs text-white font-medium">
                {video.quality}
              </span>
              <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-xs text-white font-medium">
                {translateLanguageWithFlag(video.lang)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                video.pub === 1 
                  ? 'bg-red-600/20 text-red-400 border-red-600/40' 
                  : 'bg-green-600/20 text-green-400 border-green-600/40'
              }`}>
                {video.pub === 1 ? 'Avec pub' : 'Sans pub'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                video.play === 1 
                  ? 'bg-blue-600/20 text-blue-400 border-blue-600/40' 
                  : 'bg-purple-600/20 text-purple-400 border-purple-600/40'
              }`}>
                {video.play === 1 ? 'Natif' : 'Externe'}
              </span>
            </div>
          </div>

          {/* Quick Quality Switcher */}
          {allVideos.length > 1 && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-medium">Qualité:</span>
              <div className="flex space-x-1">
                {allVideos
                  .filter(v => v !== video)
                  .slice(0, 2)
                  .map((otherVideo, index) => (
                    <a
                      key={index}
                      href={`/watch/${movie.id}?server=${encodeURIComponent(otherVideo.name)}&quality=${otherVideo.quality}&lang=${otherVideo.lang}`}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-full text-xs text-white font-medium transition-all duration-200"
                    >
                      {otherVideo.quality}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
