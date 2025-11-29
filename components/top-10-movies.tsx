'use client'

import { useState, useEffect } from 'react'
import MovieCarousel from '@/components/movie-carousel'
import { Trophy } from 'lucide-react'

interface Movie {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  vote_average: number
  vote_count: number
  release_date: string
  overview: string
  popularity: number
}

export default function Top10Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Récupérer les films les plus populaires du moment en France
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=fr-FR&page=1&region=FR`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch top movies')
        }

        const data = await response.json()
        
        // Prendre les 10 premiers films
        const topMovies = data.results.slice(0, 10)
        
        setMovies(topMovies)
      } catch (error) {
        console.error('Error fetching top movies:', error)
        // Fallback avec des données statiques
        setMovies([
          {
            id: 1,
            title: "Film Populaire 1",
            poster_path: "/poster1.jpg",
            backdrop_path: "/backdrop1.jpg",
            vote_average: 8.5,
            vote_count: 18000,
            release_date: "2024-01-01",
            overview: "Un film populaire en France...",
            popularity: 85.5
          },
          {
            id: 2,
            title: "Film Populaire 2",
            poster_path: "/poster2.jpg",
            backdrop_path: "/backdrop2.jpg",
            vote_average: 7.8,
            vote_count: 22000,
            release_date: "2024-02-15",
            overview: "Un autre film populaire en France...",
            popularity: 92.1
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopMovies()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-yellow-500"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Top 10 Actuellement au cinéma
          </h2>
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

  if (movies.length === 0) {
    return null
  }

  // Ajouter le rang aux films pour l'affichage personnalisé
  const moviesWithRank = movies.map((movie, index) => ({
    ...movie,
    rank: index + 1,
    media_type: 'movie' as const
  }))

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
      <MovieCarousel 
        title={
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Top 10 Actuellement au cinéma
          </div>
        } 
        movies={moviesWithRank}
        showRank={true}
      />
    </div>
  )
}
