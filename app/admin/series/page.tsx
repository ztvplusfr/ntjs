'use client'

import { useState, useEffect } from 'react'
import { Tv, Search, Filter, Eye, Trash2, Edit, BarChart3, Calendar, Clock, Star, Users, PlayCircle, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SeriesWithTMDB {
  id: number
  tmdb_id: number
  type: 'series'
  name?: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
  season_number?: number
  episode_number?: number
  tmdbData?: {
    id: number
    name: string
    poster_path: string
    backdrop_path: string
    overview: string
    first_air_date: string
    last_air_date: string
    vote_average: number
    vote_count: number
    popularity: number
    adult: boolean
    original_language: string
    genres: Array<{ id: number; name: string }>
    number_of_seasons: number
    number_of_episodes: number
    status: string
  }
}

interface AdminStats {
  totalSeries: number
  totalViews: number
  totalLikes: number
  totalComments: number
  avgRating: number
}

export default function AdminSeries() {
  const [series, setSeries] = useState<SeriesWithTMDB[]>([])
  const [filteredSeries, setFilteredSeries] = useState<SeriesWithTMDB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<AdminStats>({
    totalSeries: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgRating: 0
  })

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        // Récupérer les séries depuis Supabase (regrouper par tmdb_id pour éviter les doublons)
        const { data: videos, error } = await supabase
          .from('videos')
          .select('*')
          .eq('type', 'series')
          .order('tmdb_id', { ascending: true })

        if (error) {
          console.error('Error fetching series:', error)
          return
        }

        // Regrouper les vidéos par tmdb_id pour obtenir les séries uniques
        const seriesMap = new Map<number, SeriesWithTMDB>()
        
        for (const video of videos || []) {
          if (!seriesMap.has(video.tmdb_id)) {
            const seriesWithTMDB: SeriesWithTMDB = {
              ...video,
              tmdbData: undefined
            }

            // Récupérer les données TMDB
            try {
              const tmdbResponse = await fetch(
                `https://api.themoviedb.org/3/tv/${video.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR`
              )
              if (tmdbResponse.ok) {
                const tmdbData = await tmdbResponse.json()
                seriesWithTMDB.tmdbData = tmdbData
              }
            } catch (error) {
              console.error(`Error fetching TMDB data for series ${video.tmdb_id}:`, error)
            }

            seriesMap.set(video.tmdb_id, seriesWithTMDB)
          }
        }

        const uniqueSeries = Array.from(seriesMap.values())
        setSeries(uniqueSeries)
        setFilteredSeries(uniqueSeries)

        // Calculer les statistiques
        const newStats: AdminStats = {
          totalSeries: uniqueSeries.length,
          totalViews: uniqueSeries.reduce((acc, serie) => acc + (serie.play || 0), 0),
          totalLikes: 0, // Pas de champ likes dans la table videos
          totalComments: 0, // Pas de champ comments dans la table videos
          avgRating: uniqueSeries
            .filter(s => s.tmdbData?.vote_average)
            .reduce((acc, s, _, arr) => acc + (s.tmdbData?.vote_average || 0), 0) / 
            uniqueSeries.filter(s => s.tmdbData?.vote_average).length || 0
        }
        setStats(newStats)
      } catch (error) {
        console.error('Error fetching series:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [])

  useEffect(() => {
    const filtered = series.filter(serie => 
      serie.tmdbData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serie.tmdb_id?.toString().includes(searchTerm.toLowerCase()) ||
      serie.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serie.quality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serie.lang?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSeries(filtered)
  }, [searchTerm, series])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteSeries = async (tmdbId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette série et tous ses épisodes ?')) return

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('tmdb_id', tmdbId)
        .eq('type', 'series')

      if (error) {
        console.error('Error deleting series:', error)
        alert('Erreur lors de la suppression de la série')
        return
      }

      // Mettre à jour la liste
      setSeries(series.filter(s => s.tmdb_id !== tmdbId))
      setFilteredSeries(filteredSeries.filter(s => s.tmdb_id !== tmdbId))
      alert('Série supprimée avec succès')
    } catch (error) {
      console.error('Error deleting series:', error)
      alert('Erreur lors de la suppression de la série')
    }
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
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <Tv className="mr-3" />
            Gestion des Séries
          </h1>
          <p className="text-gray-400">Gérez votre catalogue de séries et leurs métadonnées</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Séries</p>
                <p className="text-2xl font-bold">{stats.totalSeries}</p>
              </div>
              <Tv className="text-purple-400" size={24} />
            </div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Vues Totales</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="text-green-400" size={24} />
            </div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Likes</p>
                <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
              </div>
              <Star className="text-yellow-400" size={24} />
            </div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Commentaires</p>
                <p className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</p>
              </div>
              <MessageCircle className="text-purple-400" size={24} />
            </div>
          </div>
          
          <div className="bg-black rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Note Moy.</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
              <BarChart3 className="text-orange-400" size={24} />
            </div>
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
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
              />
            </div>
            <button className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((serie) => (
            <div key={serie.tmdb_id} className="bg-black rounded-lg border border-white/20 overflow-hidden hover:border-purple-400/50 transition-colors">
              {/* Poster */}
              <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                {serie.tmdbData?.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${serie.tmdbData.poster_path}`}
                    alt={serie.tmdbData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Tv className="w-16 h-16" />
                  </div>
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <a 
                    href={`/admin/series/${serie.tmdb_id}`}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => handleDeleteSeries(serie.tmdb_id)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Series Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {serie.tmdbData?.name || serie.name || `Série #${serie.tmdb_id}`}
                </h3>
                
                {serie.tmdbData && (
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(serie.tmdbData.first_air_date).getFullYear() || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {serie.tmdbData.vote_average.toFixed(1)} ({serie.tmdbData.vote_count})
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {serie.tmdbData.popularity.toFixed(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      {serie.tmdbData.number_of_seasons} Saisons
                    </div>
                  </div>
                )}

                {/* Video Info */}
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Qualité: {serie.quality}</span>
                    <span>Langue: {serie.lang}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Vues: {serie.play || 0}</span>
                    <span>ID: {serie.tmdb_id}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <a 
                    href={`/admin/series/${serie.tmdb_id}`}
                    className="w-full px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSeries.length === 0 && !loading && (
          <div className="text-center py-12">
            <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'Aucune série trouvée pour cette recherche.' : 'Aucune série disponible.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
