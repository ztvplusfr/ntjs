'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound, useSearchParams } from 'next/navigation'
import { ArrowLeft, Tv, Calendar, Clock, Star, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import HistoryTracker from '@/components/history-tracker'
import PageHead from '@/components/page-head'
import ViewCounter from '@/components/view-counter'
import DiscordMessageModal from '@/components/discord-message-modal'
import { cookieUtils } from '@/lib/cookies'
import { supabase, getEpisodeVideos } from '@/lib/supabase'
import VideoPlayer from '@/components/video-player'

interface VideoServer {
  id: string
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
  hasAds: boolean
  server: string
  serverIndex?: number
}

interface EpisodeVideos {
  videos: VideoServer[]
}

interface SeasonEpisodes {
  [episodeNumber: string]: EpisodeVideos
}

interface SeasonData {
  episodes: SeasonEpisodes
}

interface SeriesVideosData {
  season: {
    [seasonNumber: string]: SeasonData
  }
}

interface EpisodeDetails {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path?: string
  air_date?: string
  runtime?: number
}

interface SerieDetails {
  id: number
  name: string
  overview: string
  backdrop_path?: string
  poster_path?: string
  first_air_date?: string
  number_of_seasons?: number
  vote_average?: number
  genres?: Array<{ id: number; name: string }>
  images?: {
    logos: Array<{
      file_path: string
      iso_639_1?: string
    }>
  }
}

interface VideoSource {
  src: string
  language: string
  quality: string
  m3u8: string
}

interface VideoSourcesResponse {
  sources: VideoSource[]
}

async function getSerieDetails(id: string): Promise<SerieDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR&append_to_response=images`
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}

// Fonction pour récupérer les logos de la série
async function getSerieLogos(id: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/images?api_key=${apiKey}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const logos = data.logos || []
    
    if (logos.length === 0) return null
    
    // Priorité: FR > EN > autre langue
    const frLogo = logos.find((logo: any) => logo.iso_639_1 === 'fr')
    if (frLogo) {
      return `https://image.tmdb.org/t/p/original${frLogo.file_path}`
    }
    
    const enLogo = logos.find((logo: any) => logo.iso_639_1 === 'en')
    if (enLogo) {
      return `https://image.tmdb.org/t/p/original${enLogo.file_path}`
    }
    
    // Prendre le premier logo disponible
    const firstLogo = logos[0]
    return `https://image.tmdb.org/t/p/original${firstLogo.file_path}`
  } catch (error) {
    return null
  }
}

async function getEpisodeDetails(serieId: string, seasonNumber: number, episodeNumber: number): Promise<EpisodeDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${serieId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}

async function getVideoSources(url: string): Promise<VideoSource[] | null> {
  try {
    if (!url) {
      return null
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data: VideoSourcesResponse = await response.json()
    return data.sources || []
  } catch (error) {
    return null
  }
}

async function getSeriesVideos(tmdbId: number, seasonNumber: number, episodeNumber: number): Promise<VideoServer[] | null> {
  try {
    // Utiliser Supabase pour récupérer les vidéos de l'épisode
    const videos = await getEpisodeVideos(tmdbId, seasonNumber, episodeNumber)
    
    if (!videos || videos.length === 0) {
      return null
    }

    // Transformer les données de Supabase au format VideoServer
    const videoServers: VideoServer[] = videos.map((video, index) => ({
      id: video.id.toString(),
      name: video.name || `Server ${index + 1}`,
      url: video.url,
      lang: video.lang,
      quality: video.quality,
      pub: video.pub,
      play: video.play,
      hasAds: video.pub === 1,
      server: video.name || `Server ${index + 1}`,
      serverIndex: index + 1
    }))

    return videoServers
  } catch (error) {
    console.error('Error fetching series videos:', error)
    return null
  }
}

// Fonction pour récupérer les informations de l'épisode depuis Supabase
async function getEpisodeRelease(tmdbId: number, seasonNumber: number, episodeNumber: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('series_releases')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('season_number', seasonNumber)
      .eq('episode_number', episodeNumber)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// Fonction pour calculer le compte à rebours
function getCountdown(releaseDate: Date, releaseTime?: string): string {
  const now = new Date()
  const target = new Date(releaseDate)
  
  if (releaseTime) {
    const [hours, minutes] = releaseTime.split(':')
    // Convert from UTC+4 (Ocean Indian) to user's timezone
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    // Convert UTC+4 time to UTC
    const utcTime = target.getTime() - (4 * 60 * 60 * 1000)
    
    // Convert to user's local timezone
    const userTime = new Date(utcTime + (now.getTimezoneOffset() * -60 * 1000))
    target.setTime(userTime.getTime())
  } else {
    target.setHours(0, 0, 0, 0)
  }
  
  const diff = target.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Maintenant'
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (days > 0) {
    return `${days}j ${hours}h ${minutes}min ${seconds}s`
  } else if (hours > 0) {
    return `${hours}h ${minutes}min ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}min ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Fonction pour formater l'heure locale pour l'affichage
function formatLocalTime(releaseTime: string): string {
  const [hours, minutes] = releaseTime.split(':')
  
  // L'heure dans la BDD est en UTC+4 (La Réunion)
  // Créer une date avec l'heure UTC+4
  const today = new Date()
  const releaseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  releaseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  // La date est déjà en UTC+4, donc on la formate directement selon le fuseau de l'utilisateur
  // Le navigateur convertira automatiquement l'heure UTC+4 vers l'heure locale
  return releaseDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).replace(':', 'h')
}

// Generate embed URL based on video URL
function getEmbedUrl(url: string): string {
  // Handle different video providers
  if (url.includes('vidhideplus.com') || url.includes('doodstream') || url.includes('proxy.afterdark.click')) {
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

// Fonction pour vérifier si l'épisode est disponible (après la date/heure de sortie)
function isEpisodeAvailable(releaseDate: Date, releaseTime?: string): boolean {
  const now = new Date()
  const target = new Date(releaseDate)
  
  if (releaseTime) {
    const [hours, minutes] = releaseTime.split(':')
    // Convert from UTC+4 (Ocean Indian) to user's timezone
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    // Convert UTC+4 time to UTC
    const utcTime = target.getTime() - (4 * 60 * 60 * 1000)
    
    // Convert to user's local timezone
    const userTime = new Date(utcTime + (now.getTimezoneOffset() * -60 * 1000))
    target.setTime(userTime.getTime())
  } else {
    target.setHours(0, 0, 0, 0)
  }
  
  return target.getTime() <= now.getTime()
}

export default function WatchSeriesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { id, season, episode } = params as { id: string; season: string; episode: string }
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [serie, setSerie] = useState<SerieDetails | null>(null)
  const [episodeDetails, setEpisodeDetails] = useState<EpisodeDetails | null>(null)
  const [videosData, setVideosData] = useState<VideoServer[] | null>(null)
  const [seriesVideosData, setSeriesVideosData] = useState<any | null>(null) // Pour la navigation
  const [selectedServer, setSelectedServer] = useState<VideoServer | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [isLoadingVideo, setIsLoadingVideo] = useState(true)
  const [serieLogo, setSerieLogo] = useState<string | null>(null)
  const [isRefreshingSources, setIsRefreshingSources] = useState(false)
  const [episodeRelease, setEpisodeRelease] = useState<any | null>(null)
  const [countdown, setCountdown] = useState<string>('')
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [episodeAvailable, setEpisodeAvailable] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      
      try {
        // Définir l'URL actuelle pour les métadonnées
        if (typeof window !== 'undefined') {
          setCurrentUrl(window.location.href)
        }
        
        // Charger les détails de la série
        const serieData = await getSerieDetails(id)
        if (!serieData) {
          setError('Série non trouvée')
          setLoading(false)
          return
        }
        setSerie(serieData)
        
        // Charger le logo de la série
        const logo = await getSerieLogos(id)
        setSerieLogo(logo)
        
        // Charger les détails de l'épisode
        const episodeData = await getEpisodeDetails(id, parseInt(season), parseInt(episode))
        if (episodeData) {
          setEpisodeDetails(episodeData)
        }
        
        // Charger les informations de sortie depuis Supabase
        if (serieData) {
          const releaseData = await getEpisodeRelease(serieData.id, parseInt(season), parseInt(episode))
          setEpisodeRelease(releaseData)
        }
        
        // Charger les vidéos disponibles depuis Supabase
        // Charger toutes les vidéos de la série pour la navigation
        const seriesResponse = await fetch(`/api/series/${serieData.id}`)
        const seriesData = await seriesResponse.json()
        
        // Charger les vidéos de l'épisode actuel
        const episodeResponse = await fetch(`/api/series/${serieData.id}/${season}/${episode}`)
        const episodeVideosData = await episodeResponse.json()
        
        if (episodeVideosData.videos && episodeVideosData.videos.length > 0) {
          setVideosData(episodeVideosData.videos)
          
          // Stocker les données de la série pour la navigation
          setSeriesVideosData(seriesData)
          
          // Récupérer les préférences depuis les cookies
          const savedPreferences = cookieUtils.getSeriesPreferences(id)
          let selectedVideo = episodeVideosData.videos[0] // Par défaut, première vidéo
          
          // Priorité 1: Paramètres d'URL
          const urlServer = searchParams.get('server')
          const urlLang = searchParams.get('lang')
          const urlQuality = searchParams.get('quality')
          const urlVideoId = searchParams.get('videoId')
          
          if (urlServer && urlLang && urlQuality) {
            const urlVideo = episodeVideosData.videos.find((video: VideoServer) => 
              video.server === urlServer && 
              video.lang === urlLang && 
              video.quality === urlQuality &&
              (!urlVideoId || video.id === urlVideoId)
            )
            if (urlVideo) {
              selectedVideo = urlVideo
            }
          } else if (savedPreferences) {
            // Priorité 2: Préférences sauvegardées
            // Chercher une vidéo qui correspond aux préférences sauvegardées
            const preferredVideo = episodeVideosData.videos.find((video: VideoServer) => 
              video.server === savedPreferences.server && 
              video.lang === savedPreferences.language && 
              video.quality === savedPreferences.quality
            )
            
            if (preferredVideo) {
              selectedVideo = preferredVideo
            }
          }
          
          setSelectedServer(selectedVideo)
        }
        
      } catch (error) {
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    
    if (id && season && episode) {
      loadData()
    }
  }, [id, season, episode])

  // Update countdown every second
  useEffect(() => {
    if (!episodeRelease) {
      setEpisodeAvailable(true)
      return
    }

    const updateCountdown = () => {
      const releaseDate = new Date(episodeRelease.release_date)
      const countdownText = getCountdown(releaseDate, episodeRelease.release_time)
      const available = isEpisodeAvailable(releaseDate, episodeRelease.release_time)
      
      setCountdown(countdownText)
      setEpisodeAvailable(available)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [episodeRelease])

  // Mettre à jour la sélection de vidéo basée sur les paramètres d'URL (sans relancer le chargement)
  useEffect(() => {
    if (!loading && videosData && videosData.length > 0) {
      const urlServer = searchParams.get('server')
      const urlLang = searchParams.get('lang')
      const urlQuality = searchParams.get('quality')
      const urlVideoId = searchParams.get('videoId')
      
      if (urlServer && urlLang && urlQuality) {
        const urlVideo = videosData.find(video => 
          video.server === urlServer && 
          video.lang === urlLang && 
          video.quality === urlQuality &&
          (!urlVideoId || video.id === urlVideoId)
        )
        if (urlVideo && (!selectedServer || selectedServer.id !== urlVideo.id)) {
          setSelectedServer(urlVideo)
        }
      }
    }
  }, [searchParams, loading, videosData, season, episode, selectedServer])

  // Mettre à jour l'URL d'embed quand la vidéo sélectionnée change
  useEffect(() => {
    if (selectedServer) {
      if (selectedServer.play === 1 && !(selectedServer.url.includes('proxy.afterdark.click') && typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent))) {
        // Lecteur natif (VideoPlayer), pas besoin d'embed URL
        setIsLoadingVideo(false)
        setEmbedUrl('')
      } else if (selectedServer.url.includes('proxy.afterdark.click') && typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Lecteur vidéo natif HTML5 direct pour proxy.afterdark.click sur iOS, pas besoin d'embed URL
        setIsLoadingVideo(false)
        setEmbedUrl('')
      } else {
        // Iframe embed (play=0), générer l'URL d'embed
        setIsLoadingVideo(true)
        const url = getEmbedUrl(selectedServer.url)
        setEmbedUrl(url)
      }
    }
  }, [selectedServer])

  // Sauvegarder les préférences quand la sélection change
  useEffect(() => {
    if (selectedServer && id) {
      const preferences = {
        id: id,
        language: selectedServer.lang,
        quality: selectedServer.quality,
        autoPlay: true,
        subtitles: false,
        server: selectedServer.server
      }
      
      cookieUtils.setSeriesPreferences(id, preferences)
    }
  }, [selectedServer, id])

  // Fonction pour vérifier si un épisode a des vidéos disponibles
  const hasEpisodeVideos = (seasonNum: string, episodeNum: string) => {
    if (!seriesVideosData || !seriesVideosData.season) return false
    
    const seasonData = seriesVideosData.season[seasonNum]
    if (!seasonData || !seasonData.episodes) return false
    
    const episodeData = seasonData.episodes[episodeNum]
    return episodeData && episodeData.videos && episodeData.videos.length > 0
  }

  // Fonction pour trouver le prochain épisode disponible (y compris dans les saisons suivantes)
  const findNextAvailableEpisode = (currentSeason: number, currentEpisode: number) => {
    if (!seriesVideosData || !seriesVideosData.season) return null
    
    // D'abord vérifier les épisodes suivants dans la même saison
    for (let ep = currentEpisode + 1; ep <= 50; ep++) { // Limite raisonnable
      if (hasEpisodeVideos(currentSeason.toString(), ep.toString())) {
        return { season: currentSeason, episode: ep }
      }
    }
    
    // Si rien trouvé, vérifier les saisons suivantes
    for (let season = currentSeason + 1; season <= 20; season++) { // Limite raisonnable
      for (let ep = 1; ep <= 50; ep++) {
        if (hasEpisodeVideos(season.toString(), ep.toString())) {
          return { season, episode: ep }
        }
      }
    }
    
    return null
  }

  // Fonction pour trouver l'épisode précédent disponible (y compris dans les saisons précédentes)
  const findPreviousAvailableEpisode = (currentSeason: number, currentEpisode: number) => {
    if (!seriesVideosData || !seriesVideosData.season) return null
    
    // D'abord vérifier les épisodes précédents dans la même saison
    for (let ep = currentEpisode - 1; ep >= 1; ep--) {
      if (hasEpisodeVideos(currentSeason.toString(), ep.toString())) {
        return { season: currentSeason, episode: ep }
      }
    }
    
    // Si rien trouvé, vérifier les saisons précédentes
    for (let season = currentSeason - 1; season >= 1; season--) {
      // Commencer par la fin de la saison précédente
      for (let ep = 50; ep >= 1; ep--) {
        if (hasEpisodeVideos(season.toString(), ep.toString())) {
          return { season, episode: ep }
        }
      }
    }
    
    return null
  }

  // Fonction pour rafraîchir les sources
  const refreshSources = async () => {
    setIsRefreshingSources(true)
    
    try {
      // Recharger les vidéos de l'épisode actuel depuis l'API
      const response = await fetch(`/api/series/${serie?.id}/${season}/${episode}`)
      const episodeVideosData = await response.json()
      
      if (episodeVideosData.videos && episodeVideosData.videos.length > 0) {
        setVideosData(episodeVideosData.videos)
        
        // Sélectionner la première vidéo si aucune n'est sélectionnée
        if (!selectedServer && episodeVideosData.videos.length > 0) {
          setSelectedServer(episodeVideosData.videos[0])
        }
      }
    } catch (error) {
      // Erreur silencieuse lors du rafraîchissement
    } finally {
      setIsRefreshingSources(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !serie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link 
            href={`/series/${id}-${serie?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '') || id}`}
            className="px-4 py-2 bg-black border border-white/30 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Retour à la série
          </Link>
        </div>
      </div>
    )
  }

  const backdropUrl = serie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}`
    : null

  const posterUrl = serie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
    : '/placeholder-poster.jpg'

  const episodeStillUrl = episodeDetails?.still_path
    ? `https://image.tmdb.org/t/p/w1280${episodeDetails.still_path}`
    : backdropUrl

  return (
    <>
      <PageHead
        title={`${serie.name} S${season}E${episode} - ${episodeDetails?.name || `Épisode ${episode}`} en streaming sur ZTVPLus`}
        description={episodeDetails?.overview || `Regarder ${serie.name} Saison ${season} Épisode ${episode} en streaming HD gratuit sur ZTVPlus. ${serie.number_of_seasons ? `${serie.number_of_seasons} saison${serie.number_of_seasons > 1 ? 's' : ''}.` : ''} ${serie.genres?.map((g: { id: number; name: string }) => g.name).slice(0, 3).join(', ') || ''}`}
        keywords={[
          serie.name,
          'streaming',
          'gratuit',
          'série',
          'VF',
          'VOSTFR',
          `saison ${season}`,
          `épisode ${episode}`,
          episodeDetails?.name || '',
          ...(serie.genres?.map((g: { id: number; name: string }) => g.name.toLowerCase()) || []),
          serie.first_air_date?.split('-')[0]
        ].filter(Boolean).join(', ')}
        image={episodeStillUrl || posterUrl}
        url={currentUrl}
        type="series"
        releaseDate={episodeDetails?.air_date || serie.first_air_date}
        genres={serie.genres?.map((g: { id: number; name: string }) => g.name)}
        duration={episodeDetails?.runtime ? `${episodeDetails.runtime * 60}` : undefined}
      />
      <div className="min-h-screen bg-black text-white">
      {/* Background */}
      {backdropUrl && (
        <div className="fixed inset-0 -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-black/90" />
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-7xl">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/series/${id}-${serie.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}?season=${season}`}
              className="px-4 py-2 bg-black border border-white/30 text-white rounded-lg hover:bg-gray-900 hover:border-white/50 transition-colors"
            >
              ← Retour à la série
            </Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-bold">{serie.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-8 w-full">
        <div className="w-full">
          {/* History Tracker - Invisible */}
          <HistoryTracker 
            type="series"
            series={{
              id: id,
              name: serie.name,
              poster_path: serie.poster_path,
              backdrop_path: serie.backdrop_path
            }}
            season={parseInt(season)}
            episode={parseInt(episode)}
            episodeTitle={episodeDetails?.name}
            video={selectedServer ? {
              id: selectedServer.id,
              hasAds: selectedServer.hasAds,
              lang: selectedServer.lang,
              pub: selectedServer.pub,
              quality: selectedServer.quality,
              server: selectedServer.server,
              url: selectedServer.url,
              serverIndex: selectedServer.serverIndex
            } : undefined}
          />
          {/* Video Player Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
              {/* Video Player - 2/3 width */}
              <div className="lg:col-span-2 w-full">
                {selectedServer && episodeAvailable ? (
                  <div className="relative w-full bg-black border border-white/20 rounded-lg overflow-hidden">
                    {selectedServer.play === 1 && !(selectedServer.url.includes('proxy.afterdark.click') && typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) ? (
                      // Lecteur vidéo natif pour play=1 (sauf proxy.afterdark.click sur iOS)
                      <VideoPlayer
                        key={`video-episode-${season}-${episode}-${selectedServer.id}`}
                        src={selectedServer.url}
                        poster={episodeStillUrl || undefined}
                        title={`${serie.name} - S${season}E${episode}`}
                        controls={true}
                        autoPlayWhenChanged={true}
                        className="w-full aspect-video select-none"
                      />
                    ) : selectedServer.url.includes('proxy.afterdark.click') && typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                      // Lecteur vidéo natif HTML5 direct pour proxy.afterdark.click sur iOS
                      <video
                        key={`native-video-episode-${season}-${episode}-${selectedServer.id}`}
                        controls
                        controlsList="nodownload noremoteplayback"
                        className="w-full aspect-video select-none"
                        poster={episodeStillUrl || undefined}
                        preload="metadata"
                        onLoadedData={() => setIsLoadingVideo(false)}
                        onError={() => setIsLoadingVideo(false)}
                        onContextMenu={(event) => event.preventDefault()}
                        onCopy={(event) => event.preventDefault()}
                        onCut={(event) => event.preventDefault()}
                        onPaste={(event) => event.preventDefault()}
                      >
                        <source src={selectedServer.url} type="application/x-mpegURL" />
                        <source src={selectedServer.url} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    ) : (
                      // Iframe embed pour play=0
                      <>
                        {isLoadingVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {embedUrl && (
                          <iframe
                            key={`episode-${season}-${episode}-${selectedServer.id}`}
                            src={embedUrl}
                            className={`w-full aspect-video border-0 ${isLoadingVideo ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture; web-share"
                            onLoad={() => setIsLoadingVideo(false)}
                            onError={() => setIsLoadingVideo(false)}
                            loading="eager"
                            title={`Regarder ${serie.name} S${season}E${episode} en streaming`}
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-black border border-white/20 rounded-lg aspect-video flex items-center justify-center w-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-black border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-white/60" />
                      </div>
                      
                      {episodeRelease && !episodeAvailable ? (
                        <>
                          <h2 className="text-lg sm:text-xl font-medium mb-2 sm:mb-2 text-blue-400">
                            Compte à rebours
                          </h2>
                          <div className="mb-3 sm:mb-4">
                            <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-sky-600/20 to-blue-600/20 border border-sky-500/30 rounded-full text-base sm:text-lg font-medium text-blue-400 mb-2">
                              {countdown}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <span className="text-gray-300">
                                S{String(episodeRelease.season_number).padStart(2, '0')}E{String(episodeRelease.episode_number).padStart(2, '0')}
                              </span>
                              {episodeRelease.release_time && (
                                <>
                                  <span className="text-gray-400 hidden sm:inline">•</span>
                                  <span className="text-gray-300">
                                    à {formatLocalTime(episodeRelease.release_time)}
                                  </span>
                                </>
                              )}
                            </div>
                            {episodeRelease.episode_title && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                                "{episodeRelease.episode_title}"
                              </p>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs sm:text-sm">
                            Revenez à la diffusion pour regarder !
                          </p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-xl font-medium mb-2">Aucune vidéo disponible</h2>
                          <p className="text-gray-400">Cet épisode n'est pas disponible - ZTVPlus</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <div className="flex flex-row items-center gap-2 mt-4 w-full">
                  <div className="flex items-center gap-2 w-full">
                    {(() => {
                      const prevEpisode = findPreviousAvailableEpisode(parseInt(season), parseInt(episode))
                      return prevEpisode ? (
                        <Link
                          href={`/watch/series/${id}/${prevEpisode.season}/${prevEpisode.episode}`}
                          className="p-2 rounded-lg border transition-colors bg-black border-white/30 hover:bg-gray-900 hover:border-white/50 text-white flex-1 flex justify-center items-center"
                        >
                          <ChevronLeft size={20} className="mr-1" />
                          <span className="text-sm">Précédent</span>
                        </Link>
                      ) : (
                        <div className="p-2 rounded-lg border bg-black border-white/10 text-gray-600 cursor-not-allowed flex-1 flex justify-center items-center">
                          <ChevronLeft size={20} className="mr-1" />
                          <span className="text-sm">Précédent</span>
                        </div>
                      )
                    })()}
                    
                    <Link
                      href={`/series/${id}-${serie.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}?season=${season}`}
                      className="px-4 py-2 bg-black border border-white/30 hover:bg-gray-900 hover:border-white/50 text-white rounded-lg transition-colors flex-1 flex justify-center items-center text-sm"
                    >
                      Épisodes
                    </Link>
                    
                    {(() => {
                      const nextEpisode = findNextAvailableEpisode(parseInt(season), parseInt(episode))
                      return nextEpisode ? (
                        <Link
                          href={`/watch/series/${id}/${nextEpisode.season}/${nextEpisode.episode}`}
                          className="p-2 rounded-lg border transition-colors bg-black border-white/30 hover:bg-gray-900 hover:border-white/50 text-white flex-1 flex justify-center items-center"
                        >
                          <span className="text-sm mr-1">Suivant</span>
                          <ChevronRight size={20} />
                        </Link>
                      ) : (
                        <div className="p-2 rounded-lg border bg-black border-white/10 text-gray-600 cursor-not-allowed flex-1 flex justify-center items-center">
                          <span className="text-sm mr-1">Suivant</span>
                          <ChevronRight size={20} />
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Bouton Signaler un problème */}
                <div className="mt-4">
                  <button
                    onClick={() => setIsSupportModalOpen(true)}
                    className="w-full p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">Signaler un problème</span>
                  </button>
                </div>
              </div>

              {/* Video Sources Sidebar - 1/3 width */}
              <div className="lg:col-span-1 w-full">
                {loading && !videosData ? (
                  <div className="bg-black border border-white/20 rounded-lg p-4 w-full">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-black/50 border border-white/10 rounded w-1/3"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-black/50 border border-white/10 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : videosData && videosData.length > 0 && episodeAvailable ? (
                  <div className="bg-black border border-white/20 rounded-lg p-4 w-full">
                    <h3 className="text-lg font-semibold mb-4 text-white">Sources disponibles</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {videosData.map((video: VideoServer, index: number) => {
                        const isSelected = Boolean(selectedServer && video.id === selectedServer.id)
                        
                        const handleClick = () => {
                          // Mettre à jour l'URL avec les paramètres vidéo
                          const newUrl = new URL(window.location.href)
                          newUrl.searchParams.set('server', video.server)
                          newUrl.searchParams.set('lang', video.lang)
                          newUrl.searchParams.set('quality', video.quality)
                          newUrl.searchParams.set('videoId', video.id)
                          
                          window.history.pushState({}, '', newUrl.toString())
                          setSelectedServer(video)
                        }
                        
                        return (
                          <div
                            key={video.id}
                            onClick={handleClick}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                              isSelected 
                                ? 'bg-sky-600/20 border-sky-500' 
                                : 'bg-black/50 border-white/20 hover:border-white/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  video.play === 1 ? 'bg-green-500' : 'bg-blue-500'
                                }`} />
                                <span className="font-medium">{video.server}</span>
                                {video.pub === 1 && (
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Ads</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="uppercase">{video.lang}</span>
                                <span>•</span>
                                <span>{video.quality}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center justify-between mt-2">
                                <div className="text-xs text-white font-medium flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                  Lecture en cours
                                </div>
                                <div className="text-xs text-gray-400">
                                  {video.quality} • {video.lang === 'vf' ? 'Version Française' : video.lang === 'vostfr' ? 'Version Originale Sous-titrée' : video.lang.toUpperCase()}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-black border border-white/20 rounded-lg p-4 w-full">
                    <h3 className="text-lg font-semibold mb-4 text-white">Sources disponibles</h3>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-black border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-white/60" />
                      </div>
                      {episodeRelease && !episodeAvailable ? (
                        <>
                          <p className="text-gray-400 mb-4">Les sources seront disponibles après la diffusion</p>
                          <div className="px-3 py-1.5 bg-gradient-to-r from-sky-600/20 to-blue-600/20 border border-sky-500/30 rounded-full text-sm font-medium text-blue-400 mb-2">
                            {countdown}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-400 mb-4">Aucune source disponible</p>
                          <button
                            onClick={refreshSources}
                            disabled={isRefreshingSources}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
                          >
                            {isRefreshingSources ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Actualisation...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Rafraîchir les sources
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Episode Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* Main Info */}
            <div className="lg:col-span-3">
              {/* Logo ou Titre de la série */}
              {serieLogo ? (
                <div className="mb-4">
                  <img 
                    src={serieLogo} 
                    alt={serie.name}
                    className="h-16 lg:h-24 object-contain"
                  />
                </div>
              ) : (
                <h1 className="text-2xl lg:text-3xl font-bold mb-4 text-white">
                  {serie.name}
                </h1>
              )}
              
              <h2 className="text-2xl font-bold mb-4">
                S{season}E{episode}: {episodeDetails?.name || `Épisode ${episode}`}
              </h2>
              
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-sm">
                  S{parseInt(season).toString().padStart(2, '0')}E{parseInt(episode).toString().padStart(2, '0')}
                </span>
                {episodeDetails?.air_date && (
                  <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-sm">
                    {new Date(episodeDetails.air_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {episodeDetails?.runtime && (
                  <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-sm">
                    {episodeDetails.runtime}min
                  </span>
                )}
                <span className="flex items-center px-3 py-1 bg-black border border-white/30 rounded-full text-sm">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="font-medium">{serie.vote_average?.toFixed(1)}</span>
                </span>
                <ViewCounter id={`${id}-${season}-${episode}`} type="series" />
              </div>

              {/* Overview */}
              {episodeDetails?.overview && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {episodeDetails.overview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Modale de support Discord */}
      <DiscordMessageModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  )
}
