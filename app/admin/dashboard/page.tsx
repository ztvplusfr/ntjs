'use client'

import { useState, useEffect } from 'react'
import { Film, Tv, FolderOpen, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react'

interface DashboardStats {
  moviesCount: number
  seriesCount: number
  totalFiles: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    moviesCount: 0,
    seriesCount: 0,
    totalFiles: 0,
    lastUpdated: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer les statistiques des fichiers JSON
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          // Fallback avec des données simulées
          setStats({
            moviesCount: 0,
            seriesCount: 0,
            totalFiles: 0,
            lastUpdated: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Fallback avec des données simulées
        setStats({
          moviesCount: 0,
          seriesCount: 0,
          totalFiles: 0,
          lastUpdated: new Date().toISOString()
        })
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
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Admin</h1>
          <p className="text-gray-400">
            Gestion des fichiers JSON de films et séries
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
            <div className="text-sm text-gray-400">fichiers JSON</div>
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
            <div className="text-sm text-gray-400">fichiers JSON</div>
          </div>

          {/* Total Files */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalFiles}</div>
            <div className="text-sm text-gray-400">fichiers JSON</div>
          </div>

          {/* Last Updated */}
          <div className="bg-black rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-sm text-gray-400">Dernière mise à jour</span>
            </div>
            <div className="text-lg font-bold mb-1">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
            <div className="text-sm text-gray-400">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString('fr-FR') : 'N/A'}
            </div>
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
              <div className="text-sm text-gray-400">Voir et modifier les fichiers JSON des films</div>
            </a>
            <a 
              href="/admin/series"
              className="p-4 bg-black rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left"
            >
              <FolderOpen className="w-5 h-5 mb-2 text-purple-400" />
              <div className="font-medium">Gérer les séries</div>
              <div className="text-sm text-gray-400">Voir et modifier les fichiers JSON des séries</div>
            </a>
            <button className="p-4 bg-black rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left">
              <TrendingUp className="w-5 h-5 mb-2 text-green-400" />
              <div className="font-medium">Statistiques détaillées</div>
              <div className="text-sm text-gray-400">Analyser l'utilisation et les tendances</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-black rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
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
