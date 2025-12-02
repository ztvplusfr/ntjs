'use client'

import { useState, useEffect } from 'react'
import { Film, Tv, FolderOpen, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  moviesCount: number
  seriesCount: number
  totalViews: number
  totalVideos: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    moviesCount: 0,
    seriesCount: 0,
    totalViews: 0,
    totalVideos: 0,
    lastUpdated: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer les statistiques depuis Supabase
        const { data: movies, error: moviesError } = await supabase
          .from('videos')
          .select('tmdb_id')
          .eq('type', 'movie')

        const { data: series, error: seriesError } = await supabase
          .from('videos')
          .select('tmdb_id')
          .eq('type', 'series')

        const { data: allVideos, error: videosError } = await supabase
          .from('videos')
          .select('play')

        if (moviesError || seriesError || videosError) {
          console.error('Error fetching stats:', moviesError || seriesError || videosError)
          return
        }

        // Compter les films et séries uniques par tmdb_id
        const uniqueMovies = new Set(movies?.map(m => m.tmdb_id))
        const uniqueSeries = new Set(series?.map(s => s.tmdb_id))
        
        const totalViews = allVideos?.reduce((acc, video) => acc + (video.play || 0), 0) || 0

        setStats({
          moviesCount: uniqueMovies.size,
          seriesCount: uniqueSeries.size,
          totalViews,
          totalVideos: allVideos?.length || 0,
          lastUpdated: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Tableau de bord Admin</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-black rounded-lg p-6 border border-white/20 animate-pulse">
                <div className="h-8 bg-white/10 rounded mb-4"></div>
                <div className="h-12 bg-white/10 rounded"></div>
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
          <h1 className="text-4xl font-bold mb-2">Tableau de bord Admin</h1>
          <p className="text-gray-400">
            Gestion des vidéos de films et séries
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Movies Count */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Film className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Films</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.moviesCount}</div>
            <div className="text-sm text-gray-400">films uniques</div>
          </div>

          {/* Series Count */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Tv className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Séries</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.seriesCount}</div>
            <div className="text-sm text-gray-400">séries uniques</div>
          </div>

          {/* Total Videos */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalVideos}</div>
            <div className="text-sm text-gray-400">vidéos</div>
          </div>

          {/* Total Views */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-sm text-gray-400">Vues</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-400">vues totales</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/admin/movies"
              className="p-4 bg-black rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left"
            >
              <FolderOpen className="w-5 h-5 mb-2 text-blue-400" />
              <div className="font-medium">Gérer les films</div>
              <div className="text-sm text-gray-400">Voir et modifier les vidéos des films</div>
            </a>
            <a 
              href="/admin/series"
              className="p-4 bg-black rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left"
            >
              <FolderOpen className="w-5 h-5 mb-2 text-purple-400" />
              <div className="font-medium">Gérer les séries</div>
              <div className="text-sm text-gray-400">Voir et modifier les vidéos des séries</div>
            </a>
            <button className="p-4 bg-black rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left">
              <TrendingUp className="w-5 h-5 mb-2 text-green-400" />
              <div className="font-medium">Statistiques détaillées</div>
              <div className="text-sm text-gray-400">Analyser l'utilisation et les tendances</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black rounded-lg p-6 border border-white/20 mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activité récente
          </h2>
          <div className="text-gray-400">
            <p>Aucune activité récente à afficher.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
