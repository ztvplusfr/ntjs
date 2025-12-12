'use client'

import { useState, useEffect, useMemo } from 'react'
import { notFound } from 'next/navigation'
import VideoCard from '@/components/video-card'
import ImageGallery from '../../../components/image-gallery'
import ShareButton from '@/components/share-button'
import SimilarMovies from '@/components/similar-movies'
import Actors from '@/components/actors'
import MovieDonationPrompt from '@/components/movie-donation-prompt'
import StreamingDisclaimer from '@/components/streaming-disclaimer'
import { Play, MessageCircle } from 'lucide-react'
import { IconBrandDiscord } from '@tabler/icons-react'
import { getRatingInfo } from '@/lib/ratings'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Video {
  id?: string
  name: string
  hasAds: boolean
  lang: string
  pub: number
  quality: string
  server: string
  url: string
  serverIndex?: number
}

interface VideoResponse {
  videos: Video[]
}

interface Movie {
  id: number
  title: string
  overview: string
  backdrop_path?: string
  poster_path?: string
  release_date?: string
  runtime?: number
  vote_average?: number
  genres?: Array<{ id: number; name: string }>
}

interface MoviePageProps {
  movie: Movie
  videos: VideoResponse | null
  imagesData: any
  similarMovies: any
  castData: any
  frenchCertification?: string | null
}

async function getStreamingVideos(id: string) {
  try {
    // Utiliser l'API interne avec NEXT_PUBLIC_BASE_URL
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/movies/${id}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    return null
  }
}

async function getMovieImages(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/images?api_key=${apiKey}`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching movie images:', error)
    return null
  }
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

async function getMovieVideos(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data?.results || []
  } catch (error) {
    console.error('Error fetching movie videos:', error)
    return null
  }
}

async function getMovieDetails(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
}

export default function MovieClientPage({ movie, videos, imagesData, similarMovies, castData, frenchCertification }: MoviePageProps) {
   const [currentUrl, setCurrentUrl] = useState('')
   const [logos, setLogos] = useState<any[]>([])
   const [tmdbVideos, setTmdbVideos] = useState<any[]>([])
   const [matureAcknowledged, setMatureAcknowledged] = useState(false)
  const [showMatureWarning, setShowMatureWarning] = useState(false)
  const ratingInfo = useMemo(() => getRatingInfo(frenchCertification), [frenchCertification])
  const frenchRatingLabel = ratingInfo?.label
  const frenchRatingCode = ratingInfo?.code
  const frenchRatingDescription = ratingInfo?.description
  const isMatureRating = Boolean(ratingInfo?.mature)

  useEffect(() => {
    if (isMatureRating) {
      setShowMatureWarning(!matureAcknowledged)
    } else {
      setShowMatureWarning(false)
      setMatureAcknowledged(false)
    }
  }, [isMatureRating, matureAcknowledged])

  const acknowledgeMatureContent = () => {
    setMatureAcknowledged(true)
    setShowMatureWarning(false)
  }

  useEffect(() => {
    console.log('MovieClientPage - Données reçues :', {
      movie: movie ? movie.title : 'non défini',
      videos: videos ? `${videos.videos?.length || 0} vidéos` : 'null',
      imagesData: imagesData ? 'présent' : 'absent'
    })

    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
    
    // Charger les logos
    getMovieLogos(movie.id.toString()).then(logoData => {
      if (logoData) {
        setLogos(logoData)
        console.log('Logos chargés:', logoData.length)
      }
    })
    
    // Charger les vidéos TMDB
    getMovieVideos(movie.id.toString()).then(videoData => {
      if (videoData) {
        setTmdbVideos(videoData)
        console.log('Vidéos TMDB chargées:', videoData.length)
      }
    })
  }, [movie.id])

  // Find best backdrop with priority: FR > other languages > any
  const getBestBackdrop = () => {
    if (!imagesData || !imagesData.backdrops || imagesData.backdrops.length === 0) return null
    
    // Try to find French backdrop first
    const frBackdrop = imagesData.backdrops.find((backdrop: any) => backdrop.iso_639_1 === 'fr')
    if (frBackdrop) return `https://image.tmdb.org/t/p/w780${frBackdrop.file_path}`
    
    // Fallback to first available backdrop
    return `https://image.tmdb.org/t/p/w780${imagesData.backdrops[0].file_path}`
  }

  // Find best logo with priority: FR > other languages > title fallback
  const getBestLogo = () => {
    if (!logos || logos.length === 0) return null
    
    // Try to find French logo first
    const frLogo = logos.find((logo: any) => logo.iso_639_1 === 'fr')
    if (frLogo) {
      return `https://image.tmdb.org/t/p/w500${frLogo.file_path}`
    }
    
    // Try to find English logo
    const enLogo = logos.find((logo: any) => logo.iso_639_1 === 'en')
    if (enLogo) {
      return `https://image.tmdb.org/t/p/w500${enLogo.file_path}`
    }
    
    // Use any available logo
    const anyLogo = logos[0]
    if (anyLogo) {
      return `https://image.tmdb.org/t/p/w500${anyLogo.file_path}`
    }
    
    return null
  }
  
  const bestLogo = getBestLogo()
  const bestBackdrop = getBestBackdrop()
  
  // Sort videos with priority: FR > other languages
  const getSortedVideos = () => {
    if (!tmdbVideos || tmdbVideos.length === 0) return []
    
    const frVideos = tmdbVideos.filter((video: any) => video.iso_639_1 === 'fr')
    const otherVideos = tmdbVideos.filter((video: any) => video.iso_639_1 !== 'fr')
    
    return [...frVideos, ...otherVideos]
  }
  
  const sortedVideos = getSortedVideos()
  
  // Prepare images for gallery
  const movieImages: any[] = []
  
  // Add poster
  if (movie.poster_path) {
    movieImages.push({
      url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      type: 'poster' as const,
      alt: `${movie.title} - Poster`
    })
  }
  
  // Add backdrop
  if (movie.backdrop_path) {
    movieImages.push({
      url: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
      type: 'backdrop' as const,
      alt: `${movie.title} - Backdrop`
    })
  }
  
  // Add additional posters and backdrops from imagesData
  if (imagesData?.posters) {
    imagesData.posters.slice(0, 4).forEach((poster: any) => {
      if (!movie.poster_path || poster.file_path !== movie.poster_path) {
        movieImages.push({
          url: `https://image.tmdb.org/t/p/w500${poster.file_path}`,
          type: 'poster' as const,
          alt: `${movie.title} - Poster`
        })
      }
    })
  }
  
  if (imagesData?.backdrops) {
    imagesData.backdrops.slice(0, 6).forEach((backdrop: any) => {
      if (!movie.backdrop_path || backdrop.file_path !== movie.backdrop_path) {
        movieImages.push({
          url: `https://image.tmdb.org/t/p/w500${backdrop.file_path}`,
          type: 'backdrop' as const,
          alt: `${movie.title} - Backdrop`
        })
      }
    })
  }
  
  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null
  
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      {showMatureWarning && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-8">
          <div className="max-w-lg space-y-4 rounded-2xl border border-white/20 bg-black/80 p-6 text-center shadow-xl shadow-black/40">
            <p className="text-xs uppercase tracking-[0.4em] text-red-400">Avertissement</p>
            <h2 className="text-2xl font-bold">Mature Audience Only (TV-MA)</h2>
            <p className="text-sm text-gray-300">
              Contenu réservé aux adultes (17+). Peut contenir :
            </p>
            <ul className="mx-auto max-w-[280px] space-y-1 text-left text-xs text-gray-300">
              <li>• Violence forte</li>
              <li>• Sexualité explicite</li>
              <li>• Langage très grossier</li>
              <li>• Scènes sensibles</li>
            </ul>
            <button
              onClick={acknowledgeMatureContent}
              className="w-full rounded-full bg-emerald-500/90 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Je confirme avoir 17 ans ou plus
            </button>
            {frenchRatingDescription && (
              <p className="text-[11px] text-gray-400">{frenchRatingDescription}</p>
            )}
          </div>
        </div>
      )}
      <div className={showMatureWarning ? 'pointer-events-none filter blur-sm' : ''}>
        {/* Hero Section */}
        <div className="relative h-[80vh] overflow-hidden -mt-16">
        {backdropUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </div>
        )}
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-8 pt-24">
          <div className="w-full">
            <div className="flex flex-col gap-6 items-start max-w-5xl">
              {/* Logo or Title */}
              <div className="pb-4">
                {bestLogo ? (
                  <img 
                    src={bestLogo} 
                    alt={movie.title}
                    className="h-20 lg:h-32 object-contain mb-4"
                  />
                ) : (
                  <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                    {movie.title}
                  </h1>
                )}
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 max-w-2xl">
                  <span className="px-2 sm:px-3 py-1 bg-black rounded-full text-xs sm:text-sm border border-white/20">
                    {movie.release_date?.split('-')[0]}
                  </span>
                  {movie.runtime && (
                    <span className="px-2 sm:px-3 py-1 bg-black rounded-full text-xs sm:text-sm border border-white/20">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                    </span>
                  )}
                  {frenchRatingLabel && (
                    <span className="px-2 sm:px-3 py-1 bg-black rounded-full text-xs sm:text-sm border border-white/20">
                      <span className="text-emerald-400 font-semibold leading-none">
                        {frenchRatingLabel}
                      </span>
                      {frenchCertification && (
                        <span className="text-gray-400 ml-2 uppercase text-[10px] tracking-wide">
                          {frenchCertification}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="flex items-center px-2 sm:px-3 py-1 bg-black rounded-full text-xs sm:text-sm border border-white/20">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="font-medium">{movie.vote_average?.toFixed(1)}</span>
                  </span>
                  <ShareButton 
                    title={movie.title}
                    url={currentUrl}
                    type="movie"
                    className="hidden sm:flex"
                  />
                </div>
                
                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 max-w-2xl">
                    {movie.genres.slice(0, 6).map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-2 sm:px-3 py-1 bg-black rounded-full text-xs sm:text-sm border border-white/20"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Overview */}
                <div className="max-w-4xl">
                  <p className="text-gray-200 leading-relaxed text-lg line-clamp-2 sm:line-clamp-none">
                    {movie.overview || 'Aucun synopsis disponible.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl">
          <MovieDonationPrompt />

          {/* Videos */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-8 bg-red-600 rounded-full"></div>
              <h2 className="text-3xl font-bold">Streaming</h2>
            </div>
            {(() => {
              console.log('Section Streaming - Données videos:', videos)
              console.log('Section Streaming - videos.videos:', videos?.videos)
              console.log('Section Streaming - Longueur:', videos?.videos?.length || 0)
              
              if (videos && videos.videos && videos.videos.length > 0) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.videos.map((video: Video, index: number) => {
                      console.log(`Video ${index}:`, video)
                      return (
                        <VideoCard 
                          key={index} 
                          video={video} 
                          index={index}
                          movieId={movie.id.toString()}
                          movieTitle={movie.title}
                          backdropUrl={bestBackdrop || undefined}
                          className="border border-white/20"
                        />
                      )
                    })}
                  </div>
                )
              } else {
                 return (
                   <>
                      <Alert className="mb-6 border-cyan-500/50 bg-cyan-600/10">
                        <MessageCircle className="h-4 w-4" />
                        <AlertDescription className="text-cyan-200 flex items-center justify-between">
                          <span>Pour demander ce film, rejoignez notre serveur Discord où vous pourrez soumettre vos demandes directement à notre équipe.</span>
                          <button
                            onClick={() => window.open('https://discord.com/invite/WjedsPDts3', '_blank')}
                            className="ml-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-[1.02] border border-indigo-500/50"
                          >
                            <IconBrandDiscord size={16} />
                            Rejoindre Discord
                          </button>
                        </AlertDescription>
                      </Alert>
                      <div className="bg-black rounded-lg p-8 text-center border border-white/20 mb-6">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <p className="text-gray-400 mb-6">Aucune vidéo disponible pour ce film.</p>
                      </div>
                     <StreamingDisclaimer />
                   </>
                 )
               }
            })()}
          </div>

          {/* Actors */}
          <Actors actors={castData?.cast || []} />

          {/* Videos Section */}
          {sortedVideos.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                <h2 className="text-3xl font-bold">Vidéos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedVideos.map((video: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-gray-900 rounded-lg overflow-hidden group cursor-pointer border border-white/20 hover:border-white/40 transition-colors"
                    onClick={() => window.location.href = `/watch/video/${movie.id}/${video.key}`}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black border border-white/20 rounded text-xs text-white">
                          {video.iso_639_1?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-black">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">{video.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {video.type === 'Trailer' ? 'Bande-annonce' : video.type} • {video.site}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {movieImages.length > 0 && (
            <div className="mb-12">
              <ImageGallery images={movieImages} movieTitle={movie.title} />
            </div>
          )}

          {/* Similar Movies */}
          <SimilarMovies movies={similarMovies?.results || []} />
        </div>
      </div>
     </div>
     </div>
  )
}
