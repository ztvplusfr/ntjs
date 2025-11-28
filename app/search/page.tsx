'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search as SearchIcon, Film, Star, Calendar, Tv } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface TMDBMovie {
  id: number
  title: string
  name?: string
  poster_path: string
  vote_average: number
  release_date: string
  first_air_date?: string
  overview: string
  media_type: 'movie' | 'tv'
}

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Récupérer la requête depuis l'URL au chargement
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setQuery(searchQuery)
    }
  }, [searchParams])

  const searchMovies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovies([])
      return
    }

    setLoading(true)
    setError('')

    try {
      // Rechercher à la fois les films et les séries
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=fr-FR`
        ),
        fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=fr-FR`
        )
      ])

      if (!moviesResponse.ok || !tvResponse.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()

      // Combiner les résultats et ajouter le type de média
      const combinedResults = [
        ...moviesData.results.map((item: any) => ({ ...item, media_type: 'movie' as const })),
        ...tvData.results.map((item: any) => ({ ...item, media_type: 'tv' as const, title: item.name }))
      ]

      // Trier par popularité (score TMDB)
      combinedResults.sort((a, b) => b.popularity - a.popularity)

      setMovies(combinedResults.slice(0, 20)) // Limiter à 20 résultats
    } catch (error) {
      setError('Erreur lors de la recherche')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMovies(query)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des films et séries..."
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Recherche en cours...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && query && movies.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Aucun résultat trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Essayez avec d'autres mots-clés</p>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {movies.length} résultat{movies.length > 1 ? 's' : ''} pour "{query}"
            </h2>
            
            {/* Movie Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((item) => (
                <Link 
                  key={`${item.media_type}-${item.id}`} 
                  href={`/${item.media_type === 'movie' ? 'movies' : 'series'}/${item.id}-${(item.title || item.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`}
                >
                  <div className="group cursor-pointer">
                    {/* Movie Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg mb-3">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          {item.media_type === 'tv' ? (
                            <Tv size={48} className="text-gray-600" />
                          ) : (
                            <Film size={48} className="text-gray-600" />
                          )}
                        </div>
                      )}
                      
                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-xs text-white font-medium">
                          {item.media_type === 'tv' ? 'SÉRIE' : 'FILM'}
                        </span>
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-medium">
                          {item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-sky-400 transition-colors">
                        {item.title || item.name}
                      </h3>
                      {(item.release_date || item.first_air_date) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={10} />
                          <span>
                            {new Date(item.release_date || item.first_air_date || '').getFullYear()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!query && !loading && (
          <div className="text-center py-20">
            <SearchIcon size={64} className="text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Rechercher des films et séries</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Utilisez la barre de recherche ci-dessus pour trouver des films, séries TV et bien plus encore.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Search() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
