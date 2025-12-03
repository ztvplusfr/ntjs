'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cookieUtils, WatchHistoryItem } from '@/lib/cookies'

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

interface Movie {
  id: number
  title: string
  poster_path: string
  release_date?: string
  vote_average?: number
}

export default function HistoryCarousel() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: true,
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  useEffect(() => {
    if (status === 'loading') return

    const loadFromCookies = async () => {
      cookieUtils.migrateFromLocalStorage()
      const cookieHistory = cookieUtils.getWatchHistory()

      if (cookieHistory.length === 0) {
        setHistory([])
        setLoading(false)
        return
      }

      const convertedHistory: HistoryItem[] = cookieHistory.map(item => {
        // Le watchedAt est maintenant au format DD-MM-YYYY HH:MM:SS
        const watchedDateStr = item.watchedAt

        // Parser la date au format DD-MM-YYYY HH:MM:SS
        const [datePart, timePart] = watchedDateStr.split(' ')
        const [day, month, year] = datePart.split('-').map(Number)
        const [hours, minutes, seconds] = timePart.split(':').map(Number)

        // Créer l'objet Date (les mois sont 0-indexés)
        const watchedDate = new Date(year, month - 1, day, hours, minutes, seconds)

        return {
          type: item.type,
          id: item.id,
          title: item.title,
          poster: item.poster || '/placeholder-poster.jpg',
          backdrop: undefined,
          timestamp: watchedDate.getTime(),
          date: `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`,
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          season: item.episode?.season,
          episode: item.episode?.episode,
          episodeTitle: undefined,
          video: undefined
        }
      })

      const updatedHistory = await Promise.all(convertedHistory.map(async (item) => {
        if (!item.poster || item.poster === '/placeholder-poster.jpg') {
          try {
            const tmdbType = item.type === 'series' ? 'tv' : 'movie'
            const response = await fetch(
              `https://api.themoviedb.org/3/${tmdbType}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR`,
              { cache: 'no-store' }
            )

            if (response.ok) {
              const data = await response.json()
              return {
                ...item,
                poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '/placeholder-poster.jpg',
                backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : undefined
              }
            }
          } catch (error) {
            console.error('Error fetching images for item:', item.id, error)
          }
        }

        return item
      }))

      const dedupedMap = new Map<string, HistoryItem>()

      updatedHistory.forEach(item => {
        const seasonKey = item.season ?? 0
        const episodeKey = item.episode ?? 0
        const key = `${item.type}-${item.id}-${seasonKey}-${episodeKey}`

        const existing = dedupedMap.get(key)
        if (!existing || item.timestamp > existing.timestamp) {
          dedupedMap.set(key, item)
        }
      })

      const dedupedHistory = Array.from(dedupedMap.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      )

      setHistory(dedupedHistory)
      setLoading(false)
    }

    const loadFromSupabase = async () => {
      try {
        const response = await fetch('/api/history', { cache: 'no-store' })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Supabase API error:', response.status, errorText)
          throw new Error('Erreur récupération historique')
        }

        const data = await response.json()
        const supabaseHistory: HistoryItem[] = (data.history || []).map((item: any) => {
          // Utiliser directement les champs de la base de données
          let dateStr = ''
          let timeStr = ''
          let timestamp = Date.now()

          if (item.last_watched_at) {
            try {
              // Format ISO de Supabase (UTC) : 2025-11-30T07:57:43.352305+00:00
              const lastWatched = new Date(item.last_watched_at)

              // Convertir en heure locale de l'appareil utilisateur
              dateStr = lastWatched.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }).replace(/\//g, '-') // DD-MM-YYYY selon locale appareil

              timeStr = lastWatched.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              }) // HH:MM selon fuseau appareil

              timestamp = lastWatched.getTime()
            } catch (error) {
              console.error('Error parsing date:', item.last_watched_at, error)
              dateStr = new Date().toLocaleDateString(undefined).replace(/\//g, '-')
              timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
            }
          } else {
            dateStr = new Date().toLocaleDateString(undefined).replace(/\//g, '-')
            timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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

        setHistory(supabaseHistory)
      } catch (error) {
        console.error('Erreur chargement historique Supabase, fallback cookies:', error)
        await loadFromCookies()
        return
      }

      setLoading(false)
    }

    if (session?.user?.id) {
      loadFromSupabase()
    } else {
      // Pour les utilisateurs non connectés, ne charger aucun historique
      setHistory([])
      setLoading(false)
    }
  }, [session, status])

  const clearHistory = async () => {
    setHistory([])
    cookieUtils.clearWatchHistory()

    if (session?.user?.id) {
      try {
        await fetch('/api/history?action=all', {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Erreur suppression historique Supabase:', error)
      }
    }
  }

  const removeFromHistory = async (id: string, season?: number, episode?: number) => {
    const targetItem = history.find(item => item.id === id && item.season === season && item.episode === episode)

    // Supprimer de l'état local immédiatement pour une meilleure UX
    setHistory(prev => {
      const newHistory = prev.filter(item => 
        !(item.id === id && item.season === season && item.episode === episode)
      )
      
      // Mettre à jour le cookie
      const episodeData = season && episode ? { season, episode } : undefined
      cookieUtils.removeFromWatchHistory(id, episodeData)
      
      return newHistory
    })

    // Supprimer de Supabase si l'utilisateur est connecté
    if (session?.user?.id && targetItem) {
      try {
        const params = new URLSearchParams({
          contentId: id,
          contentType: targetItem.type
        })
        if (typeof season === 'number') params.append('season', season.toString())
        if (typeof episode === 'number') params.append('episode', episode.toString())

        const response = await fetch(`/api/history?${params.toString()}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          console.error('Erreur suppression entrée Supabase:', response.status)
          // Optionnel: restaurer l'item si la suppression échoue
          // setHistory(prev => [...prev, targetItem])
        }
      } catch (error) {
        console.error('Erreur suppression entrée Supabase:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-blue-500"></div>
          <h2 className="text-2xl font-bold text-white">Historique</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-[0_0_calc(25%_-_0.75rem)] min-w-[280px] animate-pulse"
            >
              <div className="aspect-video bg-gray-300 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Afficher toujours la section historique, même si vide
  if (history.length === 0) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-blue-500"></div>
          <h2 className="text-2xl font-bold text-white">Historique</h2>
        </div>

        {/* Message d'invitation au centre */}
        <div className="flex justify-center">
          <div className="bg-black/30 border border-white/10 rounded-lg p-6 text-center max-w-md">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Connecte-toi pour voir ton historique</h3>
            <p className="text-gray-400 text-sm mb-4">Accède à ton historique de visionnage personnel et reprends où tu t'es arrêté</p>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-8 bg-blue-500"></div>
        <h2 className="text-2xl font-bold text-white">Historique</h2>
        <span className="text-sm text-gray-400">
          {history.length}
        </span>
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="hidden md:flex rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm text-gray-400 hover:text-red-500 px-4"
            title="Effacer tout l'historique"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="text-sm">Effacer tout</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={clearHistory}
            className="md:hidden rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm text-gray-400 hover:text-red-500"
            title="Effacer tout l'historique"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex gap-2 mr-4 md:mr-6">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {history.map((item) => (
            <Link
              key={`${item.id}-${item.season}-${item.episode}-${item.timestamp}`}
              href={
                item.type === 'series' 
                  ? item.video 
                    ? `/watch/series/${item.id}/${item.season}/${item.episode}?server=${encodeURIComponent(item.video.server)}&lang=${item.video.lang}&quality=${item.video.quality}&videoId=${item.video.id}`
                    : `/watch/series/${item.id}/${item.season}/${item.episode}`
                  : item.video 
                    ? `/watch/${item.id}?server=${encodeURIComponent(item.video.server)}&quality=${item.video.quality}&lang=${item.video.lang}&videoId=${item.video.id}`
                    : `/watch/${item.id}`
              }
              className="flex-[0_0_calc(25%_-_0.75rem)] min-w-[280px] group cursor-pointer"
              aria-label={`Regarder ${item.title}`}
            >
              <div className="relative overflow-hidden rounded-lg border border-gray-300/30 bg-black/80 backdrop-blur-sm hover:border-gray-100/50 transition-colors">
                {/* Backdrop/Poster en format paysage */}
                <div className="aspect-video relative bg-gray-200 overflow-hidden">
                  {item.backdrop && item.backdrop !== '/placeholder-backdrop.jpg' ? (
                    <Image
                      src={item.backdrop}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 400px"
                    />
                  ) : item.poster && item.poster !== '/placeholder-poster.jpg' ? (
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 400px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-sm text-center px-2">No image</span>
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      item.type === 'movie' 
                        ? 'bg-blue-600/80 border-blue-400/50 text-white' 
                        : 'bg-purple-600/80 border-purple-400/50 text-white'
                    }`}>
                      {item.type === 'movie' ? 'Film' : 'Série'}
                    </span>
                  </div>

                  {/* Bouton supprimer */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeFromHistory(item.id, item.season, item.episode)
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/80 border border-white/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:border-red-400 hover:scale-110 z-10"
                    title="Supprimer de l'historique"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {/* Info - Aligné en bas */}
                <div className="mt-3 px-3 pb-3">
                  <p className="text-sm font-medium text-white line-clamp-1 mb-1">
                    {item.title}
                  </p>
                  {item.type === 'series' && item.season && item.episode && (
                    <p className="text-xs text-gray-400 mb-1">
                      S{item.season.toString().padStart(2, '0')}E{item.episode.toString().padStart(2, '0')}
                      {item.episodeTitle && ` - ${item.episodeTitle}`}
                    </p>
                  )}
                  {item.video && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-black text-white rounded text-xs border border-white">
                        {item.type === 'movie' ? 'FILM' : 'SÉRIE'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs border ${
                        item.video.quality === '1080p' || item.video.quality === 'HD' 
                          ? 'bg-black text-white border-white' 
                          : 'bg-black text-gray-300 border-white'
                      }`}>
                        {item.video.quality}
                      </span>
                      <span className="px-2 py-1 bg-black text-gray-300 rounded text-xs border border-white">
                        {item.video.lang === 'vf' ? 'VF' : item.video.lang === 'vostfr' ? 'VOSTFR' : item.video.lang.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-black text-gray-300 rounded text-xs border border-white">
                        {item.video.server}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {item.date} • {item.time}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
