'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Share2, Download, ThumbsUp, Eye } from 'lucide-react'

interface Video {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  official: boolean
  published_at: string
  site: string
  size: number
  type: string
}

interface MovieDetails {
  id: number
  title: string
  backdrop_path?: string
  poster_path?: string
  release_date?: string
  runtime?: number
  vote_average?: number
  genres?: Array<{ id: number; name: string }>
  overview?: string
}

export default function VideoPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const movieId = params['movie-id'] as string
  const videoId = params['video-id'] as string
  
  const [video, setVideo] = useState<Video | null>(null)
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Récupérer les détails du film
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'}&language=fr-FR`
        )
        
        if (movieResponse.ok) {
          const movieData = await movieResponse.json()
          setMovie(movieData)
        }
        
        // Récupérer toutes les vidéos du film pour trouver celle avec l'ID YouTube
        const videosResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'}&language=fr-FR`
        )
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          const foundVideo = videosData.results.find((v: Video) => v.key === videoId)
          setVideo(foundVideo || null)
        }
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Impossible de charger les données')
      } finally {
        setLoading(false)
      }
    }

    if (movieId && videoId) {
      fetchData()
    }
  }, [movieId, videoId])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${video?.name} - ${movie?.title}`,
          text: `Regarde ${video?.name} de ${movie?.title} en streaming!`,
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement de la vidéo...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Vidéo non trouvée</h1>
          <p className="text-gray-400 mb-6">
            {error || 'La bande-annonce demandée n\'est pas disponible.'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        {/* Background */}
        {movie?.backdrop_path && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ 
              backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` 
            }}
          />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black" />
        
        {/* Header content */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur rounded-lg hover:bg-black/80 transition-colors"
            >
              <ArrowLeft size={20} />
              Retour
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur rounded-lg hover:bg-black/80 transition-colors"
            >
              <Share2 size={20} />
              Partager
            </button>
          </div>
          
          {/* Movie info - aligné à gauche */}
          <div className="text-left">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-left">
              {movie?.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 justify-start">
              <span className="px-3 py-1 bg-black rounded-full text-sm border border-white/20">
                {video.type === 'Trailer' ? 'Bande-annonce' : video.type}
              </span>
              <span className="px-3 py-1 bg-black rounded-full text-sm border border-white/20">
                {video.iso_639_1?.toUpperCase() || 'N/A'}
              </span>
              {movie?.release_date && (
                <span className="px-3 py-1 bg-black rounded-full text-sm border border-white/20">
                  {movie.release_date.split('-')[0]}
                </span>
              )}
            </div>
            
            <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-red-500 text-left">
              {video.name}
            </h2>
            
            {movie?.overview && (
              <p className="text-gray-300 line-clamp-3 text-left">
                {movie.overview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Video Player - en bas, aligné à gauche */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-left max-w-4xl">
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${video.key}?rel=0&showinfo=0&autoplay=1`}
              title={video.name}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          {/* Video info - aligné à gauche */}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-400 justify-start">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>YouTube</span>
            </div>
            {video.official && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">
                  Officiel
                </span>
              </div>
            )}
            {video.published_at && (
              <div>
                Publié le {new Date(video.published_at).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
