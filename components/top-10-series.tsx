'use client'

import { useState, useEffect } from 'react'
import MovieCarousel from '@/components/movie-carousel'
import { Trophy } from 'lucide-react'

interface Series {
  id: number
  name: string
  poster_path: string
  backdrop_path: string
  vote_average: number
  vote_count: number
  first_air_date: string
  overview: string
  popularity: number
}

export default function Top10Series() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopSeries = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Récupérer les séries les plus populaires du moment
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=1`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch top series')
        }

        const data = await response.json()
        
        // Prendre les 10 premières séries
        const topSeries = data.results.slice(0, 10)
        
        setSeries(topSeries)
      } catch (error) {
        console.error('Error fetching top series:', error)
        // Fallback avec des données statiques
        setSeries([
          {
            id: 1,
            name: "Série Populaire 1",
            poster_path: "/poster1.jpg",
            backdrop_path: "/backdrop1.jpg",
            vote_average: 8.5,
            vote_count: 18000,
            first_air_date: "2024-01-01",
            overview: "Une série populaire en ce moment...",
            popularity: 85.5
          },
          {
            id: 2,
            name: "Série Populaire 2",
            poster_path: "/poster2.jpg",
            backdrop_path: "/backdrop2.jpg",
            vote_average: 7.8,
            vote_count: 22000,
            first_air_date: "2024-02-15",
            overview: "Une autre série populaire en ce moment...",
            popularity: 92.1
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSeries()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-purple-500"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-500" />
            Top 10 Séries Populaires
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

  if (series.length === 0) {
    return null
  }

  // Ajouter le rang aux séries pour l'affichage personnalisé
  const seriesWithRank = series.map((serie, index) => ({
    ...serie,
    rank: index + 1,
    media_type: 'tv' as const,
    title: serie.name // Mapper name vers title pour MovieCarousel
  }))

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
      <MovieCarousel 
        title={
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-500" />
            Top 10 Séries Populaires
          </div>
        } 
        movies={seriesWithRank}
        showRank={true}
      />
    </div>
  )
}
