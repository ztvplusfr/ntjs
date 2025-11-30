'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Rewind, FastForward } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
  autoPlayWhenChanged?: boolean
  className?: string
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  autoPlayWhenChanged = false,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<any>(null)
  const hlsLoadedRef = useRef(false)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  
  const touchStart = useRef({ x: 0, y: 0 })
  const controlsTimeout = useRef<NodeJS.Timeout>()
  
  // Détection du type de vidéo et chargement
  const loadVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video || !src) return
    
    setIsLoading(true)
    setError(null)
    
    // Nettoyer l'instance HLS existante
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    
    const isHLS = src.includes('.m3u8') || src.includes('/hls/')
    
    if (isHLS) {
      // Support natif HLS pour iOS/Safari
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        return
      }
      
      // HLS.js pour les autres navigateurs
      try {
        // Vérifier si HLS.js est déjà chargé
        // @ts-ignore
        if (window.Hls) {
          initHls(video, src)
          return
        }
        
        // Charger HLS.js une seule fois
        if (!hlsLoadedRef.current) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js'
          
          script.onload = () => {
            hlsLoadedRef.current = true
            initHls(video, src)
          }
          
          script.onerror = () => {
            setError('Impossible de charger HLS.js')
            setIsLoading(false)
          }
          
          document.head.appendChild(script)
        } else {
          initHls(video, src)
        }
      } catch (err) {
        console.error('Erreur HLS:', err)
        setError('Erreur de chargement HLS')
        setIsLoading(false)
      }
    } else {
      // Vidéo MP4 standard - ne pas définir src tout de suite
      // Laisser le HTML gérer ça pour éviter les erreurs au montage
    }
  }, [src])
  
  // Initialiser HLS.js
  const initHls = (video: HTMLVideoElement, source: string) => {
    // @ts-ignore
    if (!window.Hls || !window.Hls.isSupported()) {
      setError('HLS non supporté')
      setIsLoading(false)
      return
    }
    
    // @ts-ignore
    const hls = new window.Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 60
    })
    
    hlsRef.current = hls
    hls.loadSource(source)
    hls.attachMedia(video)
    
    // @ts-ignore
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      setIsLoading(false)
    })
    
    // @ts-ignore
    hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
      console.error('HLS Error:', data)
      if (data.fatal) {
        switch (data.type) {
          // @ts-ignore
          case window.Hls.ErrorTypes.NETWORK_ERROR:
            setError('Erreur réseau')
            hls.startLoad()
            break
          // @ts-ignore
          case window.Hls.ErrorTypes.MEDIA_ERROR:
            setError('Erreur média')
            hls.recoverMediaError()
            break
          default:
            setError('Erreur de lecture')
            setIsLoading(false)
            break
        }
      }
    })
  }
  
  // Charger la vidéo au montage et changement de source
  useEffect(() => {
    // Sur mobile, attendre l'interaction utilisateur avant de charger
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobileDevice) {
      // Sur mobile, marquer comme prêt mais ne pas charger tout de suite
      setIsLoading(false)
    } else {
      // Sur desktop, charger normalement
      loadVideo()
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [loadVideo])
  
  // Configuration initiale
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.preload = 'metadata'
    video.playsInline = true
    video.muted = muted
    setIsMuted(muted)
  }, [muted])
  
  // Gestion des événements vidéo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0)
      setIsLoading(false)
    }
    
    const onCanPlay = () => {
      setIsLoading(false)
    }
    
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }
    }
    
    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }
    }
    
    const onPlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
      setIsBuffering(false)
      setError(null)
    }
    
    const onPause = () => {
      setIsPlaying(false)
      setIsBuffering(false)
    }
    
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onEnded = () => setIsPlaying(false)
    
    const onError = (e: Event) => {
      // Ignorer les erreurs si la vidéo n'a pas encore de src valide
      const video = videoRef.current
      if (!video || !video.src || video.src === window.location.href) {
        return
      }
      
      console.error('Video error:', e)
      const videoError = video.error
      
      if (videoError) {
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            setError('Lecture annulée')
            break
          case MediaError.MEDIA_ERR_NETWORK:
            setError('Erreur réseau')
            break
          case MediaError.MEDIA_ERR_DECODE:
            setError('Erreur de décodage')
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('Format non supporté')
            break
          default:
            setError('Erreur de lecture')
        }
      } else {
        setError('Erreur de chargement')
      }
      
      setIsLoading(false)
      setIsBuffering(false)
    }
    
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('progress', onProgress)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)
    
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [])
  
  // Contrôles
  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    
    // Sur mobile, charger la vidéo au premier clic si pas encore chargée
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobileDevice && !video.src && !hlsRef.current) {
      await loadVideo()
      // Attendre un peu que la vidéo se charge
      setTimeout(async () => {
        try {
          await video.play()
        } catch (err) {
          console.error('Erreur de lecture:', err)
        }
      }, 500)
      return
    }
    
    try {
      if (video.paused) {
        await video.play()
      } else {
        video.pause()
      }
    } catch (err) {
      console.error('Erreur de lecture:', err)
      setError('Impossible de lire la vidéo')
    }
  }, [loadVideo])
  
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])
  
  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    
    video.volume = newVolume
    setVolume(newVolume)
    video.muted = newVolume === 0
    setIsMuted(newVolume === 0)
  }, [])
  
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video || !isFinite(time)) return
    
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0))
  }, [])
  
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return
    
    // iOS utilise webkitEnterFullscreen sur l'élément vidéo
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    if (isIOS) {
      // @ts-ignore
      if (video.webkitEnterFullscreen) {
        try {
          // @ts-ignore
          video.webkitEnterFullscreen()
        } catch (err) {
          console.error('Erreur plein écran iOS:', err)
        }
      }
    } else {
      // Desktop et Android standard
      if (!document.fullscreenElement) {
        // Essayer les différentes API de fullscreen
        if (container.requestFullscreen) {
          container.requestFullscreen()
        } 
        // @ts-ignore
        else if (container.webkitRequestFullscreen) {
          // @ts-ignore
          container.webkitRequestFullscreen()
        }
        // @ts-ignore
        else if (container.mozRequestFullScreen) {
          // @ts-ignore
          container.mozRequestFullScreen()
        }
        // @ts-ignore
        else if (container.msRequestFullscreen) {
          // @ts-ignore
          container.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
        // @ts-ignore
        else if (document.webkitExitFullscreen) {
          // @ts-ignore
          document.webkitExitFullscreen()
        }
        // @ts-ignore
        else if (document.mozCancelFullScreen) {
          // @ts-ignore
          document.mozCancelFullScreen()
        }
        // @ts-ignore
        else if (document.msExitFullscreen) {
          // @ts-ignore
          document.msExitFullscreen()
        }
      }
    }
  }, [])
  
  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return
    
    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])
  
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || video.duration === 0) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    handleSeek(video.duration * percent)
  }, [handleSeek])
  
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])
  
  // Touch gestures
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }, [])
  
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const video = videoRef.current
    if (!video) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handleSeek(video.currentTime + 10)
      } else {
        handleSeek(video.currentTime - 10)
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        handleVolumeChange(Math.min(1, video.volume + 0.1))
      } else {
        handleVolumeChange(Math.max(0, video.volume - 0.1))
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      togglePlay()
    }
  }, [handleSeek, handleVolumeChange, togglePlay])
  
  // Raccourcis clavier
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const video = videoRef.current
    if (!video) return
    
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handleSeek(video.currentTime - 10)
        break
      case 'ArrowRight':
        e.preventDefault()
        handleSeek(video.currentTime + 10)
        break
      case 'ArrowUp':
        e.preventDefault()
        handleVolumeChange(Math.min(1, video.volume + 0.1))
        break
      case 'ArrowDown':
        e.preventDefault()
        handleVolumeChange(Math.max(0, video.volume - 0.1))
        break
      case 'm':
        e.preventDefault()
        toggleMute()
        break
      case 'f':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'c':
        e.preventDefault()
        const rates = [0.5, 1, 1.25, 1.5, 2]
        const currentIndex = rates.indexOf(video.playbackRate)
        const nextRate = rates[(currentIndex + 1) % rates.length]
        changePlaybackRate(nextRate)
        break
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault()
        if (video.duration > 0) {
          const percent = parseInt(e.key) * 10
          handleSeek((video.duration * percent) / 100)
        }
        break
    }
  }, [togglePlay, handleSeek, handleVolumeChange, toggleMute, toggleFullscreen, changePlaybackRate])
  
  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }
    
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [])
  
  // Détecter si mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={src && !src.includes('.m3u8') && !src.includes('/hls/') ? src : undefined}
        poster={poster}
        className="w-full h-full object-contain block"
        loop={loop}
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="true"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Overlay de chargement - Spinner au centre */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
          <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Overlay d'erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 text-white">
          <div className="text-center p-4">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={loadVideo}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
      
      {/* Bouton play/pause au centre - synchronisé avec les contrôles */}
      {!isLoading && !error && !isBuffering && showControls && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              togglePlay()
            }
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className={`bg-black/60 border-2 border-white/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${
              isMobile ? 'w-20 h-20' : 'w-16 h-16'
            }`}
          >
            {isPlaying ? (
              <Pause className={isMobile ? 'w-10 h-10 text-white' : 'w-8 h-8 text-white'} />
            ) : (
              <Play className={`text-white ${isMobile ? 'w-10 h-10 ml-1.5' : 'w-8 h-8 ml-1'}`} />
            )}
          </button>
        </div>
      )}
      
      {/* Contrôles */}
      {controls && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
          isMobile ? 'p-3' : 'p-4'
        } ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Barre de progression */}
          <div 
            className={`relative bg-white/20 rounded-full cursor-pointer group ${
              isMobile ? 'h-1.5 mb-3' : 'h-1 mb-4'
            }`}
            onClick={handleProgressClick}
          >
            {/* Buffer */}
            <div 
              className="absolute left-0 top-0 h-full bg-white/30 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progression */}
            <div 
              className="absolute left-0 top-0 h-full bg-sky-400 rounded-full transition-[width] duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Handle */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 bg-white rounded-full transition-opacity ${
                isMobile ? 'w-4 h-4 opacity-100' : 'w-3 h-3 opacity-0 group-hover:opacity-100'
              }`}
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          <div className={`flex items-center text-white ${isMobile ? 'gap-2' : 'gap-3'}`}>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={`flex items-center justify-center hover:text-sky-400 transition-colors ${
                isMobile ? 'w-10 h-10' : 'w-8 h-8'
              }`}
            >
              {isPlaying ? <Pause className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} /> : <Play className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />}
            </button>
            
            {/* Skip - masqué sur très petit écran */}
            {!isMobile && (
              <>
                <button
                  onClick={() => handleSeek(currentTime - 10)}
                  className="w-8 h-8 flex items-center justify-center hover:text-sky-400 transition-colors"
                  title="Reculer 10s"
                >
                  <Rewind className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSeek(currentTime + 10)}
                  className="w-8 h-8 flex items-center justify-center hover:text-sky-400 transition-colors"
                  title="Avancer 10s"
                >
                  <FastForward className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Volume - Simplifié sur mobile */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`flex items-center justify-center hover:text-sky-400 transition-colors ${
                  isMobile ? 'w-10 h-10' : 'w-8 h-8'
                }`}
              >
                {isMuted ? <VolumeX className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} /> : <Volume2 className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />}
              </button>
              {!isMobile && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-sky-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(56 189 248) 0%, rgb(56 189 248) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              )}
            </div>
            
            {/* Temps */}
            <span className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div className="flex-1" />
            
            {/* Vitesse - masqué sur mobile */}
            {!isMobile && (
              <button
                onClick={() => {
                  const rates = [0.5, 1, 1.25, 1.5, 2]
                  const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
                  changePlaybackRate(next)
                }}
                className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
              >
                {playbackRate}x
              </button>
            )}
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`flex items-center justify-center hover:text-sky-400 transition-colors ${
                isMobile ? 'w-10 h-10' : 'w-8 h-8'
              }`}
              title="Plein écran"
            >
              <Maximize2 className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
            </button>
          </div>
        </div>
      )}
      
      {/* Titre */}
      {title && (
        <div className={`absolute top-4 left-4 text-white bg-black/60 px-3 py-1 rounded-lg z-5 ${
          isMobile ? 'text-xs' : 'text-sm'
        }`}>
          {title}
        </div>
      )}
    </div>
  )
}