import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import WatchPlayer from '../../../components/watch-player'
import HistoryTracker from '../../../components/history-tracker'
import VideoSourceCard from '../../../components/video-source-card'
import ViewCounter from '../../../components/view-counter'

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

async function getMovieVideos(id: string): Promise<VideoResponse | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/videos?id=${id}`,
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

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const movie = await getMovieDetails((await params)['movie-id'])
  
  if (!movie) {
    return {
      title: 'Film non trouvé',
    }
  }
  
  return {
    title: `Regarder ${movie.title} (${movie.release_date?.split('-')[0]}) en streaming HD gratuit`,
    description: movie.overview || `Regarder ${movie.title} en streaming HD gratuit sur ZTVPlus. ${movie.runtime ? `Durée : ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min.` : ''} ${movie.genres?.map((g: any) => g.name).slice(0, 3).join(', ') || ''}`,
    keywords: `${movie.title}, streaming, vf, vostfr, gratuit, hd, ${movie.genres?.map((g: any) => g.name).join(', ')}`,
    openGraph: {
      title: `Regarder ${movie.title} en streaming HD gratuit`,
      description: movie.overview || `Regarder ${movie.title} en streaming HD gratuit sur ZTVPlus`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/watch/${(await params)['movie-id']}`,
      siteName: 'ZTVPlus - Streaming Platform',
      images: [
        movie.backdrop_path ? {
          url: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`,
          width: 1280,
          height: 720,
          alt: `${movie.title} - Image de fond`
        } : {
          url: '/og-default.jpg',
          width: 1200,
          height: 630,
          alt: 'ZTVPlus Streaming Platform'
        },
        ...(movie.poster_path ? [{
          url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          width: 500,
          height: 750,
          alt: `${movie.title} - Poster officiel`
        }] : [])
      ],
      locale: 'fr_FR',
      type: 'video.movie',
      tags: movie.genres?.map((g: any) => g.name) || [],
      releaseDate: movie.release_date,
      duration: movie.runtime ? movie.runtime * 60 : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Regarder ${movie.title} en streaming HD gratuit`,
      description: movie.overview || `Regarder ${movie.title} en streaming HD gratuit sur ZTVPlus`,
      images: movie.backdrop_path ? [`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`] : ['/og-default.jpg'],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/watch/${(await params)['movie-id']}`
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const movieId = (await params)['movie-id']
  const search = await searchParams
  
  // Fetch movie details and videos
  const [movie, videosData] = await Promise.all([
    getMovieDetails(movieId),
    getMovieVideos(movieId)
  ])
  
  if (!movie) {
    notFound()
  }

  // Find the best video based on search params or default selection
  let selectedVideo: Video | null = null
  
  if (videosData && videosData.videos && videosData.videos.length > 0) {
    // Add unique IDs to videos if they don't have them
    const videosWithIds = videosData.videos.map((video, index) => ({
      ...video,
      id: video.id || `${movieId}-video-${index}`,
      hasAds: video.pub === 1,
      server: video.name,
      serverIndex: index + 1 // 1-based index for URL
    }))
    
    // Try to find video matching search params with 1-based index
    if (search.server && search.quality && search.language) {
      const serverIndex = parseInt(search.server) - 1 // Convert to 0-based
      if (!isNaN(serverIndex) && serverIndex >= 0 && serverIndex < videosWithIds.length) {
        selectedVideo = videosWithIds[serverIndex]
      }
    }
    
    // If no specific match, select the best available
    if (!selectedVideo) {
      // Priority: HD + No Ads (pub: 0) + FR
      selectedVideo = videosWithIds.find(video => 
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

  return (
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
            <h1 className="text-xl font-bold">{movie.title}</h1>
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
            video={selectedVideo || undefined}
          />

          {/* Video Player Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
              {/* Video Player - 2/3 width */}
              <div className="lg:col-span-2 w-full">
                {selectedVideo ? (
                  <WatchPlayer 
                    video={selectedVideo}
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
                          id: video.id || `${movieId}-video-${index}`,
                          hasAds: video.pub === 1,
                          server: video.name,
                          serverIndex: index + 1 // 1-based index for URL
                        }
                        
                        // Debug: Log pour vérifier la sélection
                        
                        // Logique plus stricte : uniquement par ID
                        const isSelected = Boolean(selectedVideo && videoWithId.id === selectedVideo.id)
                        
                        return (
                          <VideoSourceCard
                            key={videoWithId.id}
                            video={videoWithId}
                            isSelected={isSelected}
                            movieId={movieId}
                            videoIndex={index}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Movie Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
              
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
              <div>
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
    </div>
  )
}
