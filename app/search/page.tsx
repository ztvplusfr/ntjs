'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Search as SearchIcon, Film, Star, Calendar, Tv } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const initialized = useRef(false)

  // Initialize query from URL only once
  useEffect(() => {
    if (!initialized.current) {
      const searchQuery = searchParams.get('search')
      if (searchQuery) {
        setQuery(searchQuery)
      }
      initialized.current = true
    }
  }, [searchParams])

  // Update URL when query changes (with debounce)
  useEffect(() => {
    if (!initialized.current) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        const params = new URLSearchParams()
        params.set('search', query)
        router.replace(`${pathname}?${params.toString()}`)
      } else {
        router.replace(pathname)
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, router, pathname])

  const searchMovies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovies([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`/api/tmdb/search/movie?query=${encodeURIComponent(searchQuery)}&language=fr-FR`),
        fetch(`/api/tmdb/search/tv?query=${encodeURIComponent(searchQuery)}&language=fr-FR`)
      ])

      if (!moviesResponse.ok || !tvResponse.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()

      const combinedResults = [
        ...moviesData.results.map((movie: any) => ({ ...movie, media_type: 'movie' })),
        ...tvData.results.map((tv: any) => ({ ...tv, media_type: 'tv', title: tv.name }))
      ]

      combinedResults.sort((a, b) => b.popularity - a.popularity)
      setMovies(combinedResults.slice(0, 20))
    } catch (error) {
      setError('Erreur lors de la recherche')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  // Search when query changes (with debounce)
  useEffect(() => {
    if (!initialized.current) return

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
                className="w-full bg-black text-white pl-10 pr-4 py-3 rounded-xl border border-white/20 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((item) => (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  href={`/${item.media_type === 'movie' ? 'movies' : 'series'}/${item.id}-${(item.title || item.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`}
                >
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg mb-3 border border-white/20 group-hover:border-white/30 transition-colors">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-black border border-white/20 flex items-center justify-center">
                          {item.media_type === 'tv' ? (
                            <Tv size={48} className="text-white/60" />
                          ) : (
                            <Film size={48} className="text-white/60" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black border border-white/30 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-xs text-white font-medium">
                          {item.media_type === 'tv' ? 'SÉRIE' : 'FILM'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 bg-black border border-white/30 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-medium">
                          {item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-sky-400 transition-colors">
                        {item.title || item.name}
                      </h3>
                      {(item.release_date || item.first_air_date) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={10} />
                          <span>{new Date(item.release_date || item.first_air_date || '').getFullYear()}</span>
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
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Utilisez la barre de recherche ci-dessus pour trouver des films, séries TV et bien plus encore.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
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
