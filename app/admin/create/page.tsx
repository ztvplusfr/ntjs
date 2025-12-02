'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Film, Tv, Plus, Check, X, Loader, Star, Calendar, Globe } from 'lucide-react'

interface TMDBResult {
  id: number
  title?: string
  name?: string
  poster_path: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  overview: string
  media_type?: string
}

interface TMDBDetails {
  id: number
  title?: string
  name?: string
  poster_path: string
  backdrop_path: string
  overview: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  original_language: string
  genres: Array<{ id: number; name: string }>
  number_of_seasons?: number
  number_of_episodes?: number
  status?: string
}

export default function CreateContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'search' | 'direct'>('search')
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie')
  const [searchQuery, setSearchQuery] = useState('')
  const [directId, setDirectId] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([])
  const [selectedContent, setSelectedContent] = useState<TMDBDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchTMDB = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/tmdb?query=${encodeURIComponent(searchQuery)}&type=${contentType}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.results || [])
      } else {
        setError(data.error || 'Erreur lors de la recherche')
      }
    } catch (error) {
      console.error('Error searching TMDB:', error)
      setError('Erreur lors de la recherche')
    } finally {
      setLoading(false)
    }
  }

  const fetchContentDetails = async (tmdbId: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/tmdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tmdb_id: tmdbId, type: contentType }),
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedContent(data)
      } else {
        setError(data.error || 'Erreur lors de la récupération des détails')
      }
    } catch (error) {
      console.error('Error fetching content details:', error)
      setError('Erreur lors de la récupération des détails')
    } finally {
      setLoading(false)
    }
  }

  const fetchDirectContent = async () => {
    if (!directId.trim()) return

    const tmdbId = parseInt(directId.trim())
    if (isNaN(tmdbId)) {
      setError('ID TMDB invalide')
      return
    }

    await fetchContentDetails(tmdbId)
  }

  const createContent = async () => {
    if (!selectedContent) return

    setCreating(true)
    setError(null)

    try {
      // Créer le contenu dans Supabase
      const contentData = {
        tmdb_id: selectedContent.id,
        type: contentType,
        title: selectedContent.title || selectedContent.name,
        overview: selectedContent.overview,
        poster_path: selectedContent.poster_path,
        backdrop_path: selectedContent.backdrop_path,
        release_date: selectedContent.release_date || selectedContent.first_air_date,
        vote_average: selectedContent.vote_average,
        vote_count: selectedContent.vote_count,
        popularity: selectedContent.popularity,
        adult: selectedContent.adult,
        original_language: selectedContent.original_language,
        genres: selectedContent.genres,
        number_of_seasons: selectedContent.number_of_seasons,
        number_of_episodes: selectedContent.number_of_episodes,
        status: selectedContent.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      })

      const result = await response.json()

      if (response.ok) {
        // Rediriger vers la page d'édition du contenu créé
        router.push(`/${contentType === 'movie' ? 'admin/movie' : 'admin/series'}/${result.id}`)
      } else {
        setError(result.error || 'Erreur lors de la création du contenu')
      }
    } catch (error) {
      console.error('Error creating content:', error)
      setError('Erreur lors de la création du contenu')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Plus className="w-8 h-8 text-blue-400" />
            Créer du contenu
          </h1>
          <p className="text-gray-400 mt-2">
            Ajoutez de nouveaux films ou séries à votre catalogue
          </p>
        </div>

        {/* Content Type Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setContentType('movie')
              setSearchResults([])
              setSelectedContent(null)
              setSearchQuery('')
              setDirectId('')
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              contentType === 'movie'
                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                : 'bg-white/5 border border-white/20 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Film className="w-4 h-4" />
            Film
          </button>
          <button
            onClick={() => {
              setContentType('tv')
              setSearchResults([])
              setSelectedContent(null)
              setSearchQuery('')
              setDirectId('')
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              contentType === 'tv'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : 'bg-white/5 border border-white/20 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Tv className="w-4 h-4" />
            Série
          </button>
        </div>

        {/* Method Selector */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              activeTab === 'search'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Rechercher
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              activeTab === 'direct'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            ID TMDB direct
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <X className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={`Rechercher un ${contentType === 'movie' ? 'film' : 'série'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, searchTMDB)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
              />
              <button
                onClick={searchTMDB}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Rechercher
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-black rounded-lg border border-white/20 overflow-hidden hover:border-white/40 transition-colors cursor-pointer group"
                    onClick={() => fetchContentDetails(result.id)}
                  >
                    <div className="aspect-[2/3] relative bg-gray-800">
                      {result.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${result.poster_path}`}
                          alt={result.title || result.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {contentType === 'movie' ? (
                            <Film className="w-12 h-12 text-gray-600" />
                          ) : (
                            <Tv className="w-12 h-12 text-gray-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {result.title || result.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span>{result.vote_average.toFixed(1)}</span>
                        <span>•</span>
                        <span>{(result.release_date || result.first_air_date)?.split('-')[0]}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {result.overview || 'Aucun synopsis disponible.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchQuery && !loading && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun résultat trouvé</p>
                <p className="text-gray-500 text-sm mt-2">
                  Essayez avec des termes différents
                </p>
              </div>
            )}
          </div>
        )}

        {/* Direct ID Tab */}
        {activeTab === 'direct' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Entrez l'ID TMDB..."
                value={directId}
                onChange={(e) => setDirectId(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, fetchDirectContent)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
              />
              <button
                onClick={fetchDirectContent}
                disabled={loading || !directId.trim()}
                className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Charger
              </button>
            </div>

            <div className="text-sm text-gray-400">
              <p>Vous pouvez trouver l'ID TMDB sur le site themoviedb.org</p>
              <p>Exemple: Pour le film "Inception", l'ID est 27205</p>
            </div>
          </div>
        )}

        {/* Selected Content Details */}
        {selectedContent && (
          <div className="mt-8 bg-black rounded-lg border border-white/20 p-6">
            <div className="flex gap-6">
              {/* Poster */}
              <div className="flex-shrink-0">
                {selectedContent.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedContent.poster_path}`}
                    alt={selectedContent.title || selectedContent.name}
                    className="w-32 h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                    {contentType === 'movie' ? (
                      <Film className="w-8 h-8 text-gray-600" />
                    ) : (
                      <Tv className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedContent.title || selectedContent.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{selectedContent.vote_average.toFixed(1)}</span>
                    <span className="text-gray-400">({selectedContent.vote_count} votes)</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{(selectedContent.release_date || selectedContent.first_air_date)?.split('-')[0]}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4" />
                    <span>{selectedContent.original_language.toUpperCase()}</span>
                  </div>

                  {selectedContent.number_of_seasons && (
                    <div className="text-sm">
                      <span className="text-gray-400">Saisons:</span> {selectedContent.number_of_seasons}
                    </div>
                  )}

                  {selectedContent.number_of_episodes && (
                    <div className="text-sm">
                      <span className="text-gray-400">Épisodes:</span> {selectedContent.number_of_episodes}
                    </div>
                  )}
                </div>

                {selectedContent.genres && selectedContent.genres.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-2 py-1 bg-white/10 rounded text-xs"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {selectedContent.overview || 'Aucun synopsis disponible.'}
                </p>

                <button
                  onClick={createContent}
                  disabled={creating}
                  className="px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? 'Création...' : 'Créer le contenu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
