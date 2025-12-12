'use client'

import { useState, useEffect } from 'react'
import MovieCarouselWithMenu from '@/components/movie-carousel-with-menu'

interface Anime {
  id: number
  name: string
  poster_path: string
  first_air_date: string
  vote_average: number
  media_type: string
}

export default function LatestAnimes() {
  const [animes, setAnimes] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestAnimes = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Utiliser la catégorie TV pour les animes
        const response = await fetch(
          `/api/tmdb/discover/tv?language=fr-FR&with_genres=16&sort_by=popularity.desc&page=1`
        )
        
        if (!response.ok) throw new Error('Failed to fetch animes')
        
        const data = await response.json()
        
        if (data.results) {
          setAnimes(data.results.slice(0, 12).map((anime: any) => ({ ...anime, media_type: 'tv' }))) // Prendre les 12 premiers animes
        }
      } catch (error) {
        console.error('Error fetching latest animes:', error)
        // Fallback avec des données statiques
        setAnimes([
          {
            id: 1,
            name: "Anime Populaire 1",
            poster_path: "/anime1.jpg",
            first_air_date: "2024-01-01",
            vote_average: 8.9,
            media_type: 'tv'
          },
          {
            id: 2,
            name: "Anime Populaire 2",
            poster_path: "/anime2.jpg",
            first_air_date: "2024-01-15",
            vote_average: 8.2,
            media_type: 'tv'
          },
          {
            id: 3,
            name: "Anime Populaire 3",
            poster_path: "/anime3.jpg",
            first_air_date: "2024-02-01",
            vote_average: 9.3,
            media_type: 'tv'
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLatestAnimes()
  }, [])

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-purple-500"></div>
          <h2 className="text-2xl font-bold text-white">Derniers Animes</h2>
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
      <MovieCarouselWithMenu title="Derniers Animes" movies={animes} />
    </div>
  )
}
