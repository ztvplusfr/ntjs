'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Clock, Tv, Play } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, SeriesRelease } from '@/lib/supabase'

interface TodayRelease {
  id: string
  tmdb_id: number
  release_date: string
  release_time: string
  episode_number: number
  season_number: number
  episode_range?: string // Nouveau champ pour les plages d'épisodes
  episode_title?: string
  series_name?: string // Nom de la série
  series_details?: {
    id: number
    name: string
    poster_path: string
    overview: string
    first_air_date: string
    number_of_seasons: number
    genres: Array<{ id: number; name: string }>
  }
}

export default function TodayReleasesCarousel() {
  const [releases, setReleases] = useState<TodayRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [seriesDetails, setSeriesDetails] = useState<Map<number, any>>(new Map())
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: true,
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

  useEffect(() => {
    const fetchTodayReleases = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Récupérer les sorties d'aujourd'hui
        const { data: releasesData, error } = await supabase
          .from('series_releases')
          .select('*')
          .eq('release_date', today)
          .order('release_time', { ascending: true })

        if (error) {
          console.error('Error fetching today releases:', error)
          setLoading(false)
          return
        }

        // Récupérer les détails des séries
        const uniqueTmdbIds = [...new Set(releasesData?.map(r => r.tmdb_id) || [])]
        const detailsMap = new Map()
        
        for (const tmdbId of uniqueTmdbIds) {
          try {
            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`,
              { cache: 'no-store' }
            )
            
            if (response.ok) {
              const data = await response.json()
              detailsMap.set(tmdbId, data)
            }
          } catch (error) {
            console.error(`Error fetching series ${tmdbId}:`, error)
          }
        }

        setSeriesDetails(detailsMap)
        setReleases(releasesData || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayReleases()
  }, [])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  const formatTime = (time: string) => {
    if (!time) return ''
    
    // Si le format est HH:MM, convertir selon l'heure locale de l'appareil
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':')
      
      // L'heure dans la BDD est en UTC+4 (La Réunion)
      // Créer une date avec l'heure UTC+4
      const today = new Date()
      const releaseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      releaseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // La date est déjà en UTC+4, donc on la formate directement selon le fuseau de l'utilisateur
      // Le navigateur convertira automatiquement l'heure UTC+4 vers l'heure locale
      const localTime = releaseDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      
      // Remplacer ':' par 'h' pour le format français
      return localTime.replace(':', 'h')
    }
    
    // Si pas de format d'heure, retourner tel quel
    return time
  }

  const formatEpisodeInfo = (season: number, episode: number, episodeRange?: string) => {
    // Si episode_range est défini, l'utiliser
    if (episodeRange) {
      return `S${season.toString().padStart(2, '0')}E${episodeRange}`
    }
    // Sinon utiliser le format standard
    return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`
  }

  const formatEpisodeInfoShort = (season: number, episode: number, episodeRange?: string) => {
    // Si episode_range est défini, l'utiliser
    if (episodeRange) {
      return `S${season}E${episodeRange}`
    }
    // Sinon utiliser le format court
    return `S${season}E${episode}`
  }

  const getFirstEpisodeFromRange = (episodeRange?: string) => {
    if (!episodeRange) return null
    // Si c'est une plage comme "1-6", extraire le premier numéro
    const match = episodeRange.match(/^(\d+)-/)
    return match ? parseInt(match[1]) : parseInt(episodeRange)
  }

  const isMultiEpisodeRange = (episodeRange?: string) => {
    if (!episodeRange) return false
    // Vérifier si c'est une plage avec plusieurs épisodes (ex: "2-8")
    const match = episodeRange.match(/^(\d+)-(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      return end > start
    }
    return false
  }

  const createSlug = (title: string, id: number) => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${id}-${slug}`
  }

  if (loading) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-cyan-500"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-500" />
            Sorties du jour
          </h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-[0_0_150px] xs:flex-[0_0_120px] sm:flex-[0_0_180px] md:flex-[0_0_200px] lg:flex-[0_0_220px] animate-pulse"
            >
              <div className="aspect-[2/3] bg-gray-300 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (releases.length === 0) {
    return (
      <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 bg-cyan-500"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-500" />
            Sorties du jour
          </h2>
        </div>
        <div className="text-center py-12 bg-black/40 border border-white/10 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune sortie aujourd'hui</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Aucun épisode n'est programmé pour aujourd'hui. Consultez l'agenda pour voir les prochaines sorties.
          </p>
          <a 
            href="/agenda"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors border border-cyan-500/50"
          >
            Voir l'agenda
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-8 bg-cyan-500"></div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:items-center">
          <Calendar className="w-6 h-6 text-cyan-500 flex-shrink-0" />
          <span className="text-2xl font-bold text-white truncate">
            Sorties du jour
          </span>
          <span className="text-cyan-300 text-sm font-medium whitespace-nowrap">
            ({releases.length} épisode{releases.length > 1 ? 's' : ''})
          </span>
        </div>
        <div className="flex-1"></div>
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

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {releases.map((release) => {
            const seriesInfo = seriesDetails.get(release.tmdb_id)
            
            if (!seriesInfo) return null

            const episodeInfo = formatEpisodeInfo(release.season_number, release.episode_number, release.episode_range)
            const episodeInfoShort = formatEpisodeInfoShort(release.season_number, release.episode_number, release.episode_range)
            const firstEpisode = getFirstEpisodeFromRange(release.episode_range) || release.episode_number
            
            // Déterminer le lien en fonction du nombre d'épisodes
            const href = isMultiEpisodeRange(release.episode_range) 
              ? `/series/${createSlug(seriesInfo.name, seriesInfo.id)}` 
              : `/watch/series/${seriesInfo.id}/${release.season_number}/${firstEpisode}`

            return (
              <Link
                key={release.id}
                href={href}
                className="flex-[0_0_150px] xs:flex-[0_0_120px] sm:flex-[0_0_180px] md:flex-[0_0_200px] lg:flex-[0_0_220px] group"
              >
                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {seriesInfo.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${seriesInfo.poster_path}`}
                        alt={seriesInfo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Tv className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badge épisode */}
                    <div className="hidden sm:block absolute top-2 left-2 bg-black/80 backdrop-blur-sm border border-cyan-500/50 rounded-lg px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-300 text-xs font-bold">
                          {episodeInfo}
                        </span>
                      </div>
                    </div>

                    {/* Badge heure */}
                    {release.release_time && (
                      <div className="hidden sm:block absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/60" />
                          <span className="text-white text-xs font-medium">
                            {formatTime(release.release_time)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center p-2">
                        <p className="text-xs font-semibold line-clamp-2 mb-1">
                          {seriesInfo.name}
                        </p>
                        <p className="text-cyan-300 text-xs">
                          {episodeInfo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-2 px-2 pb-2">
                    <p className="text-xs font-medium text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {seriesInfo.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{seriesInfo.first_air_date?.split('-')[0]}</span>
                      {/* Mobile: badges à droite comme sur desktop */}
                      <div className="flex items-center gap-1">
                        <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/50 rounded px-1 py-0.5">
                          <span className="text-cyan-300 text-xs font-bold">
                            {episodeInfoShort}
                          </span>
                        </div>
                        {formatTime(release.release_time) && (
                          <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded px-1 py-0.5">
                            <span className="text-white text-xs font-medium">
                              {formatTime(release.release_time)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
