'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import WatchPlayer from '../../../components/watch-player'
import HistoryTracker from '../../../components/history-tracker'
import VideoSourceCard from '../../../components/video-source-card'
import ViewCounter from '../../../components/view-counter'
import DiscordMessageModal from '../../../components/discord-message-modal'
import { getMovieVideos as getSupabaseMovieVideos } from '../../../lib/supabase'

interface WatchPageProps {
  params: Promise<{
    'movie-id': string
  }>
  searchParams: Promise<{
    server?: string
    quality?: string
    language?: string
  }>
}

export interface Video {
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

interface VideoResponse {
  videos: Video[]
}

async function getMovieLogos(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/images?api_key=${apiKey}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data?.logos || []
  } catch (error) {
    console.error('Error fetching movie logos:', error)
    return null
  }
}

async function getMovieVideos(movieId: string): Promise<VideoResponse | null> {
  try {
    const videos = await getSupabaseMovieVideos(parseInt(movieId))
    
    if (!videos || videos.length === 0) {
      return null
    }

    // Transformer les données de Supabase au format VideoResponse
    const videoServers = videos.map((video, index) => ({
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

    return { videos: videoServers }
  } catch (error) {
    console.error('Error fetching movie videos:', error)
    return null
  }
}

async function getMovieDetails(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=fr-FR`,
      {
        cache: 'no-store',
      }
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    return null
  }
}

export default function WatchPage({ params, searchParams }: WatchPageProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [movie, setMovie] = useState<any>(null)
  const [videosData, setVideosData] = useState<any>(null)
  const [logosData, setLogosData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [movieId, setMovieId] = useState<string>('')
  const [search, setSearch] = useState<any>({})
  
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      const id = resolvedParams['movie-id']
      
      setMovieId(id)
      setSearch(resolvedSearchParams)
      
      // Fetch movie details, videos and logos
      const [movieData, videosResponse, logosResponse] = await Promise.all([
        getMovieDetails(id),
        getMovieVideos(id),
        getMovieLogos(id)
      ])
      
      setMovie(movieData)
      setVideosData(videosResponse)
      setLogosData(logosResponse)
      setLoading(false)
    }
    
    loadData()
  }, [params, searchParams])
  
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
  
  if (!movie) {
    notFound()
  }

  // Find the best video based on search params or default selection
  let currentSelectedVideo: Video | null = null
  
  if (videosData && videosData.videos && videosData.videos.length > 0) {
    // Add unique IDs to videos if they don't have them
    const videosWithIds = videosData.videos.map((video, index) => ({
      ...video,
      id: video.id || `${movie.id}-video-${index}`,
      hasAds: video.pub === 1,
      server: video.name,
      serverIndex: index + 1 // 1-based index for URL
    }))
    
    // Try to find video matching search params with 1-based index
    if (search.server && search.quality && search.language) {
      const serverIndex = parseInt(search.server) - 1 // Convert to 0-based
      if (!isNaN(serverIndex) && serverIndex >= 0 && serverIndex < videosWithIds.length) {
        currentSelectedVideo = videosWithIds[serverIndex]
      }
    }
    
    // If no specific match, select the best available
    if (!currentSelectedVideo) {
      // Priority: HD + No Ads (pub: 0) + FR
      currentSelectedVideo = videosWithIds.find(video => 
        video.quality === '1080p' && video.pub === 0 && video.lang === 'vostfr'
      ) ||
      videosWithIds.find(video => 
        video.quality === '1080p' && video.pub === 0
      ) ||
      videosWithIds.find(video => video.quality === '1080p') ||
      videosWithIds.find(video => video.lang === 'vostfr') ||
      videosWithIds[0] // Fallback to first video
    }
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null

  // Find best logo with priority: FR > EN > other languages > any
  const getBestLogo = () => {
    if (!logosData || logosData.length === 0) return null
    
    // Try to find French logo first
    const frLogo = logosData.find((logo: any) => logo.iso_639_1 === 'fr')
    if (frLogo) {
      return `https://image.tmdb.org/t/p/w500${frLogo.file_path}`
    }
    
    // Try to find English logo
    const enLogo = logosData.find((logo: any) => logo.iso_639_1 === 'en')
    if (enLogo) {
      return `https://image.tmdb.org/t/p/w500${enLogo.file_path}`
    }
    
    // Use any available logo
    const anyLogo = logosData[0]
    if (anyLogo) {
      return `https://image.tmdb.org/t/p/w500${anyLogo.file_path}`
    }
    
    return null
  }
  
  const bestLogo = getBestLogo()

  return (
    <>
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
                href={`/movies/${movieId}-${movie.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-black border border-white/30 text-white rounded-lg hover:bg-gray-900 hover:border-white/50 transition-colors"
              >
                ← Retour au film
              </Link>
              <span className="text-gray-500">|</span>
              {bestLogo ? (
                <img 
                  src={bestLogo} 
                  alt={movie.title}
                  className="h-8 object-contain"
                />
              ) : (
                <h1 className="text-xl font-bold">{movie.title}</h1>
              )}
              <ViewCounter id={movieId} type="movie" className="ml-auto" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-4 pb-8 w-full">
          <div className="w-full">
            {/* History Tracker - Invisible */}
            <HistoryTracker 
              type="movie"
              movie={{
                id: movieId,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path
              }}
              video={currentSelectedVideo ? {
                id: currentSelectedVideo.id,
                hasAds: currentSelectedVideo.hasAds,
                lang: currentSelectedVideo.lang,
                pub: currentSelectedVideo.pub,
                quality: currentSelectedVideo.quality,
                server: currentSelectedVideo.server,
                url: currentSelectedVideo.url,
                serverIndex: currentSelectedVideo.serverIndex
              } : undefined}
            />

            {/* Video Player Section */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                {/* Video Player - 2/3 width */}
                <div className="lg:col-span-2 w-full">
                  {currentSelectedVideo ? (
                    <WatchPlayer 
                      video={currentSelectedVideo}
                      movie={movie}
                      allVideos={videosData?.videos || []}
                    />
                  ) : (
                    <div className="bg-black border border-white/20 rounded-lg aspect-video flex items-center justify-center w-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-black border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <h2 className="text-xl font-medium mb-2">Aucune vidéo disponible</h2>
                        <p className="text-gray-400">Ce film n'est pas disponible en streaming pour le moment.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Sources Sidebar - 1/3 width */}
                <div className="lg:col-span-1 w-full">
                  {videosData && videosData.videos && videosData.videos.length > 0 && (
                    <div className="bg-black border border-white/20 rounded-lg p-4 w-full">
                      <h3 className="text-lg font-semibold mb-4 text-white">Sources disponibles</h3>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {videosData.videos.map((video: Video, index: number) => {
                          const videoWithId = {
                            ...video,
                            id: video.id || `${movie.id}-video-${index}`,
                            hasAds: video.pub === 1,
                            server: video.name,
                            serverIndex: index + 1 // 1-based index for URL
                          }
                          
                          // Logique plus stricte : uniquement par ID
                          const isSelected = Boolean(currentSelectedVideo && videoWithId.id === currentSelectedVideo.id)
                          
                          return (
                            <VideoSourceCard
                              key={videoWithId.id}
                              video={videoWithId}
                              isSelected={isSelected}
                              movieId={movie.id}
                              videoIndex={index}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
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
              </div>
            </div>

            {/* Movie Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              {/* Main Info */}
              <div className="lg:col-span-2">
                {bestLogo ? (
                  <div className="mb-4">
                    <img 
                      src={bestLogo} 
                      alt={movie.title}
                      className="h-16 lg:h-20 object-contain"
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
                )}
                
                {/* Meta */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-sm">
                    {movie.release_date?.split('-')[0]}
                  </span>
                  {movie.runtime && (
                    <span className="px-3 py-1 bg-black border border-white/20 rounded-full text-sm">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                    </span>
                  )}
                  <span className="flex items-center px-3 py-1 bg-black border border-white/20 rounded-full text-sm">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="font-medium">{movie.vote_average?.toFixed(1)}</span>
                  </span>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-black border border-white/20 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <div className="bg-black border border-white/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {movie.overview || 'Aucun synopsis disponible.'}
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div>
                {/* Additional movie info could go here */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Modale de support Discord */}
        <DiscordMessageModal 
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      </div>
    </>
  )
}