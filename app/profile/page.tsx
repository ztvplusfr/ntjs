'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Film, Tv, Calendar, TrendingUp, Clock } from 'lucide-react'
import HistoryCarousel from '@/components/history-carousel'
import PageHead from '@/components/page-head'

interface ProfileStats {
  totalMovies: number
  totalEpisodes: number
  totalWatchTime: number // en minutes
  averageRating: number
  lastActivity: string
}

interface HistoryItem {
  type: 'movie' | 'series'
  id: string
  title: string
  poster: string
  backdrop?: string
  timestamp: number
  date: string
  time: string
  season?: number
  episode?: number
  episodeTitle?: string
  video?: {
    id: string
    hasAds: boolean
    lang: string
    pub: number
    quality: string
    server: string
    url: string
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all')
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    loadProfileData()
    detectDeviceInfo()
  }, [session, status, router])

  // Fonction pour détecter les informations de l'appareil
  const detectDeviceInfo = () => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent
    const platform = navigator.platform

    // Détecter le système d'exploitation
    let os = 'Unknown'
    if (userAgent.includes('Windows NT')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) os = 'iOS'

    // Détecter le type d'appareil
    let deviceType = 'Unknown'
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('Android')) {
      deviceType = 'Mobile'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceType = 'Tablet'
    } else {
      deviceType = 'Desktop'
    }

    // Détecter le navigateur
    let browser = 'Unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    else if (userAgent.includes('Opera')) browser = 'Opera'

    setDeviceInfo({
      os: os,
      deviceType: deviceType,
      browser: browser,
      userAgent: userAgent.substring(0, 50) + '...', // Tronquer pour affichage
      platform: platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  const loadProfileData = async () => {
    try {
      // Charger l'historique depuis Supabase
      const response = await fetch('/api/history', { cache: 'no-store' })

      if (!response.ok) {
        console.error('Erreur chargement historique')
        setLoading(false)
        return
      }

      const data = await response.json()
      const historyData: HistoryItem[] = (data.history || []).map((item: any) => {
        let dateStr = ''
        let timeStr = ''
        let timestamp = Date.now()

        if (item.last_watched_at) {
          try {
            const lastWatched = new Date(item.last_watched_at)
            dateStr = lastWatched.toLocaleDateString(undefined, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).replace(/\//g, '-')
            timeStr = lastWatched.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })
            timestamp = lastWatched.getTime()
          } catch (error) {
            dateStr = new Date().toLocaleDateString(undefined).replace(/\//g, '-')
            timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          }
        }

        return {
          type: item.content_type,
          id: item.content_id,
          title: item.title || 'Titre inconnu',
          poster: item.poster || '/placeholder-poster.jpg',
          backdrop: item.backdrop,
          timestamp: timestamp,
          date: dateStr,
          time: timeStr,
          season: item.season ?? undefined,
          episode: item.episode ?? undefined,
          episodeTitle: item.episode_title,
          video: item.video_id ? {
            id: item.video_id,
            hasAds: item.video_has_ads || false,
            lang: item.video_lang || '',
            pub: item.video_pub || 0,
            quality: item.video_quality || '',
            server: item.video_server || '',
            url: item.video_url || '',
            serverIndex: item.video_server_index
          } : undefined
        }
      })

      // Calculer les statistiques
      const moviesCount = historyData.filter(item => item.type === 'movie').length
      const episodesCount = historyData.filter(item => item.type === 'series').length
      const totalWatchTime = historyData.reduce((total, item) => {
        // Estimation : 90min par film, 45min par épisode
        return total + (item.type === 'movie' ? 90 : 45)
      }, 0)

      const lastActivity = historyData.length > 0
        ? new Date(Math.max(...historyData.map(item => item.timestamp))).toLocaleDateString('fr-FR')
        : 'Aucune activité'

      setStats({
        totalMovies: moviesCount,
        totalEpisodes: episodesCount,
        totalWatchTime: totalWatchTime,
        averageRating: 0, // TODO: calculer depuis les ratings
        lastActivity: lastActivity
      })

      // Trier l'historique par date (plus récent en premier)
      const sortedHistory = historyData.sort((a, b) => b.timestamp - a.timestamp)
      setHistory(sortedHistory)

    } catch (error) {
      console.error('Erreur chargement données profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })

  // Regrouper l'historique par date
  const groupedByDate = Object.entries(
    filteredHistory.reduce((acc, item) => {
      const dateKey = item.date
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(item)
      return acc
    }, {} as Record<string, typeof filteredHistory>)
  ).sort(([a], [b]) => b.localeCompare(a)) // Trier par date décroissante

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      <PageHead
        title={`Profil - ${session.user.name || 'Utilisateur'}`}
        description="Consultez votre profil, vos statistiques de visionnage et votre historique personnalisé sur ZTVPlus"
        keywords="profil, historique, statistiques, ZTVPlus"
        image="/og-default.jpg"
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-black border-b border-gray-800 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-sky-500/50"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-sky-500/50">
                  <User size={32} className="text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{session.user.name || 'Utilisateur'}</h1>
                <p className="text-gray-400">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-black border border-sky-500/30 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Statistiques
                </h2>

                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Film size={16} className="text-blue-400" />
                        <span className="text-sm">Films vus</span>
                      </div>
                      <span className="font-bold text-blue-400">{stats.totalMovies}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tv size={16} className="text-purple-400" />
                        <span className="text-sm">Épisodes vus</span>
                      </div>
                      <span className="font-bold text-purple-400">{stats.totalEpisodes}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-400" />
                        <span className="text-sm">Temps total</span>
                      </div>
                      <span className="font-bold text-green-400">
                        {Math.floor(stats.totalWatchTime / 60)}h {stats.totalWatchTime % 60}min
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-orange-400" />
                        <span className="text-sm">Dernière activité</span>
                      </div>
                      <span className="font-bold text-orange-400 text-xs">{stats.lastActivity}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Device Information */}
              <div className="bg-black border border-sky-500/30 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User size={20} />
                  Appareil actuel
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                    <span className="text-sm text-gray-300">Système</span>
                    <span className="font-bold text-sky-400">{deviceInfo?.os || 'Chargement...'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                    <span className="text-sm text-gray-300">Type</span>
                    <span className="font-bold text-sky-400">{deviceInfo?.deviceType || 'Chargement...'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                    <span className="text-sm text-gray-300">Navigateur</span>
                    <span className="font-bold text-sky-400">{deviceInfo?.browser || 'Chargement...'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                    <span className="text-sm text-gray-300">Langue</span>
                    <span className="font-bold text-sky-400">{deviceInfo?.language || 'Chargement...'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black border border-sky-500/20 rounded-lg">
                    <span className="text-sm text-gray-300">Fuseau horaire</span>
                    <span className="font-bold text-sky-400 text-xs">{deviceInfo?.timezone || 'Chargement...'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="lg:col-span-2">
              <div className="bg-black border border-sky-500/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock size={20} />
                    Historique de visionnage
                  </h2>

                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                        filter === 'all'
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-black text-gray-400 hover:bg-gray-900 border-sky-500/30'
                      }`}
                    >
                      Tout
                    </button>
                    <button
                      onClick={() => setFilter('movie')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                        filter === 'movie'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-black text-gray-400 hover:bg-gray-900 border-sky-500/30'
                      }`}
                    >
                      Films
                    </button>
                    <button
                      onClick={() => setFilter('series')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                        filter === 'series'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-black text-gray-400 hover:bg-gray-900 border-sky-500/30'
                      }`}
                    >
                      Séries
                    </button>
                  </div>
                </div>

                {/* History Items Grouped by Date */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Aucun élément dans l'historique</p>
                      {filter !== 'all' && (
                        <p className="text-sm mt-2">Essayez de changer le filtre</p>
                      )}
                    </div>
                  ) : (
                    groupedByDate.map(([date, items]) => (
                      <div key={date} className="space-y-3">
                        {/* Date Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-sky-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-white">
                            {new Date(date.split('-').reverse().join('-')).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h3>
                          <div className="flex-1 h-px bg-sky-500/30"></div>
                          <span className="text-sm text-sky-400 font-medium">
                            {items.length} élément{items.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Items for this date - Grid layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.map((item) => (
                            <div
                              key={`${item.id}-${item.timestamp}`}
                              className="flex gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors border border-sky-500/10"
                            >
                              {/* Poster */}
                              <div className="w-12 h-16 flex-shrink-0">
                                <img
                                  src={item.poster}
                                  alt={item.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-white text-sm line-clamp-1">{item.title}</h4>
                                    {item.type === 'series' && item.season && item.episode && (
                                      <p className="text-xs text-gray-400 truncate">
                                        S{item.season.toString().padStart(2, '0')}E{item.episode.toString().padStart(2, '0')}
                                        {item.episodeTitle && ` - ${item.episodeTitle}`}
                                      </p>
                                    )}
                                    <p className="text-xs text-sky-400 mt-1">
                                      {item.time}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 ml-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                                      item.type === 'movie'
                                        ? 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                                        : 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                                    }`}>
                                      {item.type === 'movie' ? 'F' : 'S'}
                                    </span>
                                    {item.video && (
                                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                                        {item.video.quality}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
