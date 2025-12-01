'use client'

import { useState, useEffect } from 'react'
import { supabase, SeriesRelease } from '@/lib/supabase'
import { Calendar, Clock, Tv, Play } from 'lucide-react'
import Link from 'next/link'

interface TodayRelease {
  id: string
  tmdb_id: number
  release_date: string
  release_time: string
  episode_number: number
  season_number: number
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

export default function TodayReleases() {
  const [releases, setReleases] = useState<TodayRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [seriesDetails, setSeriesDetails] = useState<Map<number, any>>(new Map())

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

  const formatReleaseTime = (time: string) => {
    if (!time) return 'Aujourd\'hui'
    return `à ${time}`
  }

  const formatEpisodeInfo = (season: number, episode: number) => {
    return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Sorties du jour</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-gray-800"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-800 rounded"></div>
                <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (releases.length === 0) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Sorties du jour</h2>
        </div>
        <div className="text-center py-12 bg-black/40 border border-white/10 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune sortie aujourd'hui</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Aucun épisode n'est programmé pour aujourd'hui. Consultez l'agenda pour voir les prochaines sorties.
          </p>
          <Link 
            href="/agenda"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors border border-cyan-500/50"
          >
            Voir l'agenda
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Sorties du jour</h2>
          <span className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/50 rounded-full text-cyan-300 text-sm font-medium">
            {releases.length} épisode{releases.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link 
          href="/agenda"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-1"
        >
          Voir tout l'agenda
          <Play className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {releases.map((release) => {
          const seriesInfo = seriesDetails.get(release.tmdb_id)
          
          if (!seriesInfo) return null

          return (
            <Link 
              key={release.id}
              href={`/series/${seriesInfo.id}-${seriesInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')}`}
              className="group block bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
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
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-cyan-500/50 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Play className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-300 text-xs font-bold">
                      {formatEpisodeInfo(release.season_number, release.episode_number)}
                    </span>
                  </div>
                </div>

                {/* Badge heure */}
                {release.release_time && (
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/60" />
                      <span className="text-white text-xs font-medium">
                        {release.release_time}
                      </span>
                    </div>
                  </div>
                )}

                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-4">
                <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                  {seriesInfo.name}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span>{seriesInfo.first_air_date?.split('-')[0]}</span>
                  <span>•</span>
                  <span>{seriesInfo.number_of_seasons} saison{seriesInfo.number_of_seasons > 1 ? 's' : ''}</span>
                </div>

                {seriesInfo.genres && seriesInfo.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {seriesInfo.genres.slice(0, 2).map((genre: { id: number; name: string }) => (
                      <span 
                        key={genre.id}
                        className="px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded text-cyan-300 text-xs"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-center text-xs text-cyan-400 font-medium">
                  {formatReleaseTime(release.release_time)}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
