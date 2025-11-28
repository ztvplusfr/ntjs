'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound, useSearchParams } from 'next/navigation'
import { ArrowLeft, Tv, Calendar, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import HistoryTracker from '@/components/history-tracker'
import PageHead from '@/components/page-head'
import ViewCounter from '@/components/view-counter'
import { cookieUtils } from '@/lib/cookies'

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
    console.error('TMDB API key is not configured')
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching serie details:', error)
    return null
  }
}

async function getEpisodeDetails(serieId: string, seasonNumber: number, episodeNumber: number): Promise<EpisodeDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('TMDB API key is not configured')
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${serieId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching episode details:', error)
    return null
  }
}

async function getVideoSources(url: string): Promise<VideoSource[] | null> {
  try {
    if (!url) {
      console.error('getVideoSources: URL is empty or undefined')
      return null
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`Video sources API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data: VideoSourcesResponse = await response.json()
    return data.sources || []
  } catch (error) {
    console.error('Error fetching video sources:', error)
    return null
  }
}

async function getSeriesVideos(id: string): Promise<SeriesVideosData | null> {
  try {
    const response = await fetch(`/api/series/${id}`)
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching series videos:', error)
    return null
  }
}

// Generate embed URL based on video URL
function getEmbedUrl(url: string): string {
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

export default function WatchSeriesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { id, season, episode } = params as { id: string; season: string; episode: string }
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [serie, setSerie] = useState<SerieDetails | null>(null)
  const [episodeDetails, setEpisodeDetails] = useState<EpisodeDetails | null>(null)
  const [videosData, setVideosData] = useState<SeriesVideosData | null>(null)
  const [selectedServer, setSelectedServer] = useState<VideoServer | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [isLoadingVideo, setIsLoadingVideo] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      
      console.log('Loading data for:', { id, season, episode })
      
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
        
        // Charger les détails de l'épisode
        const episodeData = await getEpisodeDetails(id, parseInt(season), parseInt(episode))
        if (episodeData) {
          setEpisodeDetails(episodeData)
        }
        
        // Charger les vidéos disponibles
        const videos = await getSeriesVideos(id)
        if (videos) {
          setVideosData(videos)
          
          // Ajouter des IDs uniques à toutes les vidéos si elles n'en ont pas
          const episodeVideos = videos.season[season]?.episodes[episode]
          if (episodeVideos?.videos?.length > 0) {
            // Traiter les vidéos avec play=1 pour récupérer les vraies sources
            const processedVideos = await Promise.all(
              episodeVideos.videos.map(async (video, index) => {
                if (video.play === 1 && video.url) {
                  try {
                    // Récupérer les vraies sources
                    const sources = await getVideoSources(video.url)
                    if (sources && sources.length > 0) {
                      // Transformer chaque source en une vidéo distincte
                      return sources.map((source, sourceIndex) => ({
                        id: `${id}-s${season}e${episode}-video-${index}-source-${sourceIndex}`,
                        name: video.name,
                        url: source.m3u8,
                        lang: source.language.toLowerCase().includes('french') || source.language === 'French' ? 'vf' : 
                             source.language.toLowerCase().includes('multi') ? 'vostfr' : 
                             source.language.toLowerCase(),
                        quality: source.quality,
                        pub: video.pub,
                        play: 1,
                        hasAds: video.pub === 1,
                        server: video.name,
                        serverIndex: index + 1,
                        originalSrc: source.src
                      }))
                    } else {
                      // Si aucune source trouvée, garder la vidéo originale
                      return [{
                        ...video,
                        id: video.id || `${id}-s${season}e${episode}-video-${index}`,
                        hasAds: video.pub === 1,
                        server: video.name,
                        serverIndex: index + 1
                      }]
                    }
                  } catch (error) {
                    console.error(`Failed to fetch sources for video ${video.name}:`, error)
                    // Garder la vidéo originale en cas d'erreur
                    return [{
                      ...video,
                      id: video.id || `${id}-s${season}e${episode}-video-${index}`,
                      hasAds: video.pub === 1,
                      server: video.name,
                      serverIndex: index + 1
                    }]
                  }
                }
                // Vidéo normale, la garder telle quelle
                return [{
                  ...video,
                  id: video.id || `${id}-s${season}e${episode}-video-${index}`,
                  hasAds: video.pub === 1,
                  server: video.name,
                  serverIndex: index + 1
                }]
              })
            )
            
            // Aplatir le tableau de vidéos
            const videosWithIds = processedVideos.flat()
            
            // Mettre à jour les données avec les IDs
            const updatedVideosData = { ...videos }
            if (updatedVideosData.season[season]?.episodes[episode]) {
              updatedVideosData.season[season].episodes[episode].videos = videosWithIds
            }
            setVideosData(updatedVideosData)
            
            // Récupérer les préférences depuis les cookies
            const savedPreferences = cookieUtils.getSeriesPreferences(id)
            let selectedVideo = videosWithIds[0] // Par défaut, première vidéo
            
            // Priorité 1: Paramètres d'URL
            const urlServer = searchParams.get('server')
            const urlLang = searchParams.get('lang')
            const urlQuality = searchParams.get('quality')
            const urlVideoId = searchParams.get('videoId')
            
            if (urlServer && urlLang && urlQuality) {
              const urlVideo = videosWithIds.find(video => 
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
              const preferredVideo = videosWithIds.find(video => 
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
        }
        
      } catch (error) {
        setError('Erreur lors du chargement')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    
    if (id && season && episode) {
      loadData()
    }
  }, [id, season, episode])

  // Mettre à jour la sélection de vidéo basée sur les paramètres d'URL (sans relancer le chargement)
  useEffect(() => {
    if (!loading && videosData?.season[season]?.episodes[episode]?.videos) {
      const videosWithIds = videosData.season[season].episodes[episode].videos
      const urlServer = searchParams.get('server')
      const urlLang = searchParams.get('lang')
      const urlQuality = searchParams.get('quality')
      const urlVideoId = searchParams.get('videoId')
      
      if (urlServer && urlLang && urlQuality) {
        const urlVideo = videosWithIds.find(video => 
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
      if (selectedServer.play === 1) {
        // Lecteur natif, pas besoin d'embed URL
        setIsLoadingVideo(false)
        setEmbedUrl('')
      } else {
        // Iframe embed, générer l'URL d'embed
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
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
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
        title={`${serie.name} S${season}E${episode} - ${episodeDetails?.name || `Épisode ${episode}`} en streaming HD gratuit`}
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
              className="text-gray-300 hover:text-white transition-colors"
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
            video={selectedServer || undefined}
          />
          {/* Video Player Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
              {/* Video Player - 2/3 width */}
              <div className="lg:col-span-2 w-full">
                {selectedServer ? (
                  <div className="relative w-full bg-black rounded-lg overflow-hidden">
                    {selectedServer.play === 1 ? (
                      // Lecteur vidéo natif pour play=1
                      <video
                        key={selectedServer.url}
                        controls
                        className="w-full aspect-video"
                        poster={episodeStillUrl || undefined}
                        preload="metadata"
                        onLoadedData={() => setIsLoadingVideo(false)}
                        onError={() => setIsLoadingVideo(false)}
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
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center w-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-gray-600" />
                      </div>
                      <h2 className="text-xl font-medium mb-2">Aucune vidéo disponible</h2>
                      <p className="text-gray-400">Cet épisode n'est pas disponible en streaming pour le moment.</p>
                    </div>
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/watch/series/${id}/${season}/${parseInt(episode) - 1}`}
                      className={`p-2 rounded-lg transition-colors ${
                        parseInt(episode) > 1
                          ? 'bg-gray-800 hover:bg-gray-700 text-white'
                          : 'bg-gray-900 text-gray-600 cursor-not-allowed pointer-events-none'
                      }`}
                      aria-disabled={parseInt(episode) <= 1}
                    >
                      <ChevronLeft size={20} className="sm:hidden" />
                      <span className="hidden sm:flex items-center gap-2">
                        <ChevronLeft size={20} />
                        Épisode précédent
                      </span>
                    </Link>
                    
                    <Link
                      href={`/series/${id}-${serie.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}?season=${season}`}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Épisodes
                    </Link>
                    
                    <Link
                      href={`/watch/series/${id}/${season}/${parseInt(episode) + 1}`}
                      className={`p-2 rounded-lg transition-colors ${
                        videosData?.season[season]?.episodes[(parseInt(episode) + 1).toString()]
                          ? 'bg-sky-500 hover:bg-sky-600 text-white'
                          : 'bg-gray-900 text-gray-600 cursor-not-allowed pointer-events-none'
                      }`}
                      aria-disabled={!videosData?.season[season]?.episodes[(parseInt(episode) + 1).toString()]}
                    >
                      <ChevronRight size={20} className="sm:hidden" />
                      <span className="hidden sm:flex items-center gap-2">
                        Épisode suivant
                        <ChevronRight size={20} />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Video Sources Sidebar - 1/3 width */}
              <div className="lg:col-span-1 w-full">
                {loading && !videosData?.season[season]?.episodes[episode]?.videos ? (
                  <div className="bg-gray-900 rounded-lg p-4 w-full">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-800 rounded w-1/3"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-800 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : videosData?.season[season]?.episodes[episode]?.videos && videosData.season[season].episodes[episode].videos.length > 0 ? (
                  <div className="bg-gray-900 rounded-lg p-4 w-full">
                    <h3 className="text-lg font-semibold mb-4 text-white">Sources disponibles</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {videosData.season[season].episodes[episode].videos.map((video: VideoServer, index: number) => {
                        const isSelected = Boolean(selectedServer && video.id === selectedServer.id)
                        
                        const handleClick = () => {
                          // Garder la même URL de base mais changer de source via le state
                          setSelectedServer(video)
                        }
                        
                        return (
                          <div
                            key={video.id}
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
                                {video.lang === 'vf' ? 'Version Française' : video.lang === 'vostfr' ? 'Version Originale Sous-titrée' : video.lang.toUpperCase()}
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
                  <div className="bg-gray-900 rounded-lg p-4 w-full">
                    <h3 className="text-lg font-semibold mb-4 text-white">Sources disponibles</h3>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400">Aucune source disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Episode Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">
                Épisode {episode}: {episodeDetails?.name || `Épisode ${episode}`}
              </h2>
              
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  S{parseInt(season).toString().padStart(2, '0')}E{parseInt(episode).toString().padStart(2, '0')}
                </span>
                {episodeDetails?.air_date && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {new Date(episodeDetails.air_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {episodeDetails?.runtime && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {episodeDetails.runtime}min
                  </span>
                )}
                <span className="flex items-center px-3 py-1 bg-gray-800 rounded-full text-sm">
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

            {/* Sidebar - Empty or additional info */}
            <div>
              {loading && !serie ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-gray-800 rounded"></div>
                  <div className="h-20 bg-gray-800 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Informations</h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Série: {serie.name}</p>
                      <p>Saison: {season}</p>
                      <p>Épisode: {episode}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
