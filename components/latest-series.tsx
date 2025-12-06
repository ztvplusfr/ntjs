'use client'

import { useState, useEffect } from 'react'
import MovieCarouselWithMenu from '@/components/movie-carousel-with-menu'

interface Serie {
  id: number
  name: string
  poster_path: string
  first_air_date: string
  vote_average: number
  media_type: string
}

export default function LatestSeries() {
  const [series, setSeries] = useState<Serie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestSeries = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Utiliser la catégorie TV pour les séries
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=1`
        )
        
        if (!response.ok) throw new Error('Failed to fetch series')
        
        const data = await response.json()
        
        if (data.results) {
          setSeries(data.results.slice(0, 12).map((serie: any) => ({ ...serie, media_type: 'tv' }))) // Prendre les 12 premières séries
        }
      } catch (error) {
        console.error('Error fetching latest series:', error)
        // Fallback avec des données statiques
        setSeries([
          {
            id: 1,
            name: "Série Populaire 1",
            poster_path: "/serie1.jpg",
            first_air_date: "2024-01-01",
            vote_average: 8.7,
            media_type: 'tv'
          },
          {
            id: 2,
            name: "Série Populaire 2",
            poster_path: "/serie2.jpg",
            first_air_date: "2024-01-15",
            vote_average: 7.9,
            media_type: 'tv'
          },
          {
            id: 3,
            name: "Série Populaire 3",
            poster_path: "/serie3.jpg",
            first_air_date: "2024-02-01",
            vote_average: 9.1,
            media_type: 'tv'
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLatestSeries()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-green-500"></div>
          <h2 className="text-2xl font-bold text-white">Dernières Séries</h2>
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
      <MovieCarouselWithMenu title="Dernières Séries" movies={series} />
    </div>
  )
}
