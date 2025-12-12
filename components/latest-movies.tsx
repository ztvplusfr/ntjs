'use client'

import { useState, useEffect } from 'react'
import MovieCarouselWithMenu from '@/components/movie-carousel-with-menu'

interface Movie {
  id: number
  title: string
  poster_path: string
  release_date: string
  vote_average: number
  media_type: string
}

export default function LatestMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestMovies = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        console.log('TMDB API Key available:', !!apiKey && apiKey !== 'your_api_key_here')
        
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=fr-FR&page=1`
        )
        
        console.log('TMDB Response status:', response.status)
        
        if (!response.ok) throw new Error(`Failed to fetch movies: ${response.status}`)
        
        const data = await response.json()
        
        console.log('TMDB Data received:', !!data.results, data.results?.length)
        
        if (data.results) {
          setMovies(data.results.slice(0, 12).map((movie: any) => ({ ...movie, media_type: 'movie' }))) // Prendre les 12 premiers films
        }
      } catch (error) {
        console.error('Error fetching latest movies:', error)
        // Fallback avec des données statiques
        setMovies([
          {
            id: 1,
            title: "Film Récent 1",
            poster_path: "/poster1.jpg",
            release_date: "2024-01-01",
            vote_average: 8.5,
            media_type: 'movie'
          },
          {
            id: 2,
            title: "Film Récent 2",
            poster_path: "/poster2.jpg",
            release_date: "2024-01-15",
            vote_average: 7.8,
            media_type: 'movie'
          },
          {
            id: 3,
            title: "Film Récent 3",
            poster_path: "/poster3.jpg",
            release_date: "2024-02-01",
            vote_average: 9.1,
            media_type: 'movie'
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLatestMovies()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-blue-500"></div>
          <h2 className="text-2xl font-bold text-white">Derniers Films</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-[0_0_150px] xs:flex-[0_0_120px] sm:flex-[0_0_180px] md:flex-[0_0_200px] lg:flex-[0_0_220px] animate-pulse"
            >
              <div className="aspect-[2/3] bg-gray-300 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
      <MovieCarouselWithMenu title="Derniers Films" movies={movies} />
    </div>
  )
}
