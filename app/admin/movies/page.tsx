'use client'

import { useState, useEffect } from 'react'
import { Film, Search, Filter, Eye, Trash2, Edit, BarChart3, Calendar, Clock, Star, Users, PlayCircle } from 'lucide-react'

interface MovieFile {
  pathname: string
  uploadedAt: string
  size: number
  url: string
}

interface MovieWithTMDB extends MovieFile {
  tmdbData?: {
    id: number
    title: string
    poster_path: string
    backdrop_path: string
    overview: string
    release_date: string
    vote_average: number
    vote_count: number
    popularity: number
    adult: boolean
    original_language: string
    genres: Array<{ id: number; name: string }>
  }
  extractedId?: string
}

interface AdminStats {
  totalMovies: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalSize: number
  avgRating: number
}

export default function AdminMovies() {
  const [movies, setMovies] = useState<MovieWithTMDB[]>([])
  const [filteredMovies, setFilteredMovies] = useState<MovieWithTMDB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<AdminStats>({
    totalMovies: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSize: 0,
    avgRating: 0
  })

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Récupérer la liste des fichiers movies
        const response = await fetch('/api/admin/movies')
        if (response.ok) {
          const data = await response.json()
          setMovies(data.movies)
          setFilteredMovies(data.movies)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching movies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  useEffect(() => {
    const filtered = movies.filter(movie => 
      movie.tmdbData?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.extractedId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.pathname.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredMovies(filtered)
  }, [searchTerm, movies])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-black rounded-lg p-4 border border-white/20 animate-pulse">
                <div className="h-8 bg-white/10 rounded mb-2"></div>
                <div className="h-12 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-black rounded-lg p-6 border border-white/20 animate-pulse">
                <div className="h-32 bg-white/10 rounded mb-4"></div>
                <div className="h-6 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Film className="w-8 h-8 text-blue-400" />
            Gestion des Films
          </h1>
          <p className="text-gray-400">
            Liste des fichiers JSON des films avec informations TMDB associées
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Total Films</span>
            </div>
            <div className="text-xl font-bold">{stats.totalMovies}</div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Vues Totales</span>
            </div>
            <div className="text-xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Likes</span>
            </div>
            <div className="text-xl font-bold">{stats.totalLikes.toLocaleString()}</div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Commentaires</span>
            </div>
            <div className="text-xl font-bold">{stats.totalComments.toLocaleString()}</div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Taille Totale</span>
            </div>
            <div className="text-xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Note Moyenne</span>
            </div>
            <div className="text-xl font-bold">{stats.avgRating.toFixed(1)}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-black rounded-lg p-4 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, ID ou nom de fichier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
              />
            </div>
            <button className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMovies.map((movie) => (
            <div key={movie.pathname} className="bg-black rounded-lg border border-white/20 overflow-hidden hover:border-blue-400/50 transition-colors">
              {/* Poster */}
              <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                {movie.tmdbData?.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.tmdbData.poster_path}`}
                    alt={movie.tmdbData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Film className="w-16 h-16" />
                  </div>
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <a 
                    href={`/admin/movie/${movie.extractedId || movie.pathname.split('/').pop()?.replace('.json', '')}`}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {movie.tmdbData?.title || movie.extractedId || 'Inconnu'}
                </h3>
                
                {movie.tmdbData && (
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(movie.tmdbData.release_date).getFullYear() || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {movie.tmdbData.vote_average.toFixed(1)} ({movie.tmdbData.vote_count})
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {movie.tmdbData.popularity.toFixed(0)}
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Fichier: {movie.pathname.split('/').pop()}</span>
                    <span>{formatFileSize(movie.size)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Ajouté: {formatDate(movie.uploadedAt)}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <a 
                    href={`/admin/movie/${movie.extractedId || movie.pathname.split('/').pop()?.replace('.json', '')}`}
                    className="w-full px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMovies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'Aucun film trouvé pour cette recherche.' : 'Aucun film disponible.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
