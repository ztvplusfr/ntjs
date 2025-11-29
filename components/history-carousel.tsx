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
        console.log('No history found in cookies')
        setHistory([])
        setLoading(false)
        return
      }

      console.log('History loaded from cookies:', cookieHistory.length, 'items')

      const convertedHistory: HistoryItem[] = cookieHistory.map(item => {
        const watchedDate = new Date(item.watchedAt)
        return {
          type: item.type,
          id: item.id,
          title: item.title,
          poster: item.poster || '/placeholder-poster.jpg',
          backdrop: undefined,
          timestamp: watchedDate.getTime(),
          date: watchedDate.toLocaleDateString('fr-FR'),
          time: watchedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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
          throw new Error('Erreur récupération historique')
        }

        const data = await response.json()
        const supabaseHistory: HistoryItem[] = (data.history || []).map((item: any) => {
          const lastWatched = item.last_watched_at ? new Date(item.last_watched_at) : new Date()
          const metadata = item.metadata || {}
          return {
            type: item.content_type,
            id: item.content_id,
            title: metadata.title || 'Titre inconnu',
            poster: metadata.poster || '/placeholder-poster.jpg',
            backdrop: metadata.backdrop,
            timestamp: lastWatched.getTime(),
            date: lastWatched.toLocaleDateString('fr-FR'),
            time: lastWatched.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            season: item.season ?? undefined,
            episode: item.episode ?? undefined,
            episodeTitle: metadata.episodeTitle,
            video: metadata.video
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
      loadFromCookies()
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

    setHistory(prev => {
      const newHistory = prev.filter(item => 
        !(item.id === id && item.season === season && item.episode === episode)
      )
      
      // Mettre à jour le cookie
      const episodeData = season && episode ? { season, episode } : undefined
      cookieUtils.removeFromWatchHistory(id, episodeData)
      
      console.log('Item removed from history, new count:', newHistory.length)
      return newHistory
    })

    if (session?.user?.id) {
      try {
        const params = new URLSearchParams({
          contentId: id,
          contentType: targetItem?.type || 'movie'
        })
        if (typeof season === 'number') params.append('season', season.toString())
        if (typeof episode === 'number') params.append('episode', episode.toString())

        await fetch(`/api/history?${params.toString()}`, {
          method: 'DELETE'
        })
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

  if (history.length === 0) {
    console.log('History is empty, not rendering carousel')
    return null
  }

  console.log('Rendering carousel with', history.length, 'items')

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
                    className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700 z-10"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.video.quality === '1080p' || item.video.quality === 'HD' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {item.video.quality}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                        {item.video.lang === 'vf' ? 'VF' : item.video.lang === 'vostfr' ? 'VOSTFR' : item.video.lang.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
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
