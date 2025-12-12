'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Film, Tv, Calendar, TrendingUp, Clock, BookmarkPlus } from 'lucide-react'
import Link from 'next/link'
import PageHead from '@/components/page-head'

interface ProfileStats {
  totalMovies: number
  totalEpisodes: number
  totalWatchTime: number // en minutes
  averageRating: number
  lastActivity: string
}

interface WatchlistStats {
  total: number
  movies: number
  series: number
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
  const [watchlistStats, setWatchlistStats] = useState<WatchlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user) {
      router.push('/auth/signin')
      return
    }

    loadProfileData()
    loadWatchlistStats()
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

        if (item.updated_at) {
          try {
            const updatedAt = new Date(item.updated_at)
            dateStr = updatedAt.toLocaleDateString(undefined, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).replace(/\//g, '-')
            timeStr = updatedAt.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })
            timestamp = updatedAt.getTime()
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

    } catch (error) {
      console.error('Erreur chargement données profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWatchlistStats = async () => {
    try {
      const response = await fetch('/api/watchlist', { cache: 'no-store' })
      if (!response.ok) {
        return
      }

      const data = await response.json()
      if (data.stats) {
        setWatchlistStats(data.stats)
        return
      }

      if (Array.isArray(data.list)) {
        setWatchlistStats({
          total: data.list.length,
          movies: data.list.filter((item: any) => item.content_type === 'movie').length,
          series: data.list.filter((item: any) => item.content_type === 'series').length
        })
      }
    } catch (error) {
      console.error('Erreur chargement watchlist stats:', error)
    }
  }

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
            <div className="lg:col-span-2 space-y-6">
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

              <div className="bg-black border border-sky-500/30 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookmarkPlus size={20} />
                  Raccourcis
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/profile/watchlist"
                    className="block rounded-2xl border border-white/10 bg-gray-900/60 p-4 transition hover:border-white/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Watchlist</p>
                        <p className="text-2xl font-semibold text-white">
                          {watchlistStats ? `${watchlistStats.total} contenus` : 'Chargement...'}
                        </p>
                      </div>
                      <BookmarkPlus size={24} className="text-amber-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Accédez à tout ce que vous avez mis de côté.
                    </p>
                  </Link>
                  <Link
                    href="/profile/history"
                    className="block rounded-2xl border border-white/10 bg-gray-900/60 p-4 transition hover:border-white/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Historique</p>
                        <p className="text-2xl font-semibold text-white">
                          {stats ? `${stats.totalMovies + stats.totalEpisodes} éléments` : 'Chargement...'}
                        </p>
                      </div>
                      <Clock size={24} className="text-sky-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Reprenez la lecture là où vous l'avez laissée.
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Dernière activité : {stats?.lastActivity || 'Chargement...'}
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-black border border-sky-500/30 rounded-xl p-6 backdrop-blur-sm space-y-4">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
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
          </div>
        </div>
      </div>
    </>
  )
}
