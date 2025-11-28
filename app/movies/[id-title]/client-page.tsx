'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import VideoCard from '@/components/video-card'
import ImageGallery from '../../../components/image-gallery'
import ShareButton from '@/components/share-button'

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
}

async function getMovieVideos(id: string) {
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
    console.error('Error fetching movie videos:', error)
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

export default function MovieClientPage({ movie, videos, imagesData }: MoviePageProps) {
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

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
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden -mt-16">
        {backdropUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        )}
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-end px-4 sm:px-6 lg:px-8 pb-8 pt-24">
          <div className="w-full">
            <div className="flex flex-col gap-8 items-start max-w-5xl">
              {/* Info */}
              <div className="pb-4 lg:pb-8">
                <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                  {movie.title}
                </h1>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                    {movie.release_date?.split('-')[0]}
                  </span>
                  {movie.runtime && (
                    <span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                    </span>
                  )}
                  <span className="flex items-center px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="font-medium">{movie.vote_average?.toFixed(1)}</span>
                  </span>
                  <ShareButton 
                    title={movie.title}
                    url={currentUrl}
                    type="movie"
                  />
                </div>
                
                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-gray-700/60 backdrop-blur rounded-full text-sm border border-gray-600"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Overview */}
                <div className="max-w-4xl">
                  <p className="text-gray-200 leading-relaxed text-lg">
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
          {/* Videos */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-3xl font-bold">Streaming</h2>
            </div>
            {videos && videos.videos && videos.videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.videos.map((video: Video, index: number) => (
                  <VideoCard 
                    key={index} 
                    video={video} 
                    index={index}
                    movieId={movie.id.toString()}
                    movieTitle={movie.title}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-gray-400">Aucune vidéo disponible pour ce film.</p>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {movieImages.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
                <h2 className="text-3xl font-bold">Galerie d'images</h2>
              </div>
              <ImageGallery images={movieImages} movieTitle={movie.title} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
