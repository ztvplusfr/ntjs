'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import Link from 'next/link'

interface TMDBContent {
  id: number
  title?: string
  name?: string
  overview: string
  backdrop_path: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  runtime?: number
  media_type?: string
}

export default function Hero() {
  const [featuredContent, setFeaturedContent] = useState<TMDBContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        // TMDB API key - à remplacer par votre clé API
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Récupérer aléatoirement soit un film populaire soit une série populaire
        const isMovie = Math.random() > 0.5
        const endpoint = isMovie 
          ? `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1`
          : `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=1`
        
        const response = await fetch(endpoint)
        
        if (!response.ok) throw new Error('Failed to fetch content')
        
        const data = await response.json()
        
        // Prendre le premier contenu comme vedette et récupérer ses détails
        if (data.results && data.results.length > 0) {
          const content = data.results[0]
          
          // Récupérer les détails complets pour obtenir la durée
          const detailsEndpoint = isMovie
            ? `https://api.themoviedb.org/3/movie/${content.id}?api_key=${apiKey}&language=fr-FR`
            : `https://api.themoviedb.org/3/tv/${content.id}?api_key=${apiKey}&language=fr-FR`
          
          const detailsResponse = await fetch(detailsEndpoint)
          
          if (detailsResponse.ok) {
            const details = await detailsResponse.json()
            setFeaturedContent({
              ...content,
              runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]),
              media_type: isMovie ? 'Film' : 'Série'
            })
          } else {
            setFeaturedContent({
              ...content,
              media_type: isMovie ? 'Film' : 'Série'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching featured content:', error)
        // Fallback avec des données statiques
        setFeaturedContent({
          id: 1,
          title: "Film Populaire",
          overview: "Découvrez ce contenu captivant qui va vous tenir en haleille du début à la fin.",
          backdrop_path: "/backdrop.jpg",
          release_date: "2024-01-01",
          vote_average: 8.5,
          runtime: 120,
          media_type: "Film"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedContent()
  }, [])

  if (loading) {
    return (
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    )
  }

  if (!featuredContent) return null

  const backdropUrl = featuredContent.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${featuredContent.backdrop_path}`
    : '/placeholder-hero.jpg'

  const title = featuredContent.title || featuredContent.name || 'Contenu'
  const year = featuredContent.release_date?.split('-')[0] || featuredContent.first_air_date?.split('-')[0] || '2024'

  return (
    <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden -mt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            {title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-200 mb-8">
            <span className="px-3 py-1 bg-gray-700/50 rounded-full backdrop-blur-sm">
              {featuredContent.media_type || 'Film'}
            </span>
            <span className="px-3 py-1 bg-gray-700/50 rounded-full backdrop-blur-sm">
              {year}
            </span>
            {featuredContent.runtime && (
              <span className="px-3 py-1 bg-gray-700/50 rounded-full backdrop-blur-sm">
                {Math.floor(featuredContent.runtime / 60)}h {featuredContent.runtime % 60}min
              </span>
            )}
            <span className="px-3 py-1 bg-gray-700/50 rounded-full backdrop-blur-sm flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              {featuredContent.vote_average?.toFixed(1) || 'N/A'}
            </span>
          </div>
          
          <p className="text-sm sm:text-base text-gray-200 mb-6 line-clamp-3 md:line-clamp-4">
            {featuredContent.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href={featuredContent.media_type === 'Série' || featuredContent.media_type === 'Serie' 
              ? `/series/${featuredContent.id}-${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
              : `/movies/${featuredContent.id}-${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
            }>
              <Button variant="secondary" size="lg" className="bg-gray-500/50 text-white hover:bg-gray-500/70 backdrop-blur-sm w-full sm:w-auto">
                <Info className="w-5 h-5 mr-2" />
                Plus d'infos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
