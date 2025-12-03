'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Play, Calendar, Clock, Star, ChevronDown, ChevronUp, Tv, Filter, Settings, Trash2, Info, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import ShareButton from '@/components/share-button'
import PageHead from '@/components/page-head'
import StreamingDisclaimer from '@/components/streaming-disclaimer'
import SeriesRequestModal from '@/components/series-request-modal'
import { supabase } from '@/lib/supabase'
import { getRatingInfo } from '@/lib/ratings'

// Interface pour les données vidéos (correspond à l'API locale)
interface VideoServer {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
}

interface EpisodeVideos {
  videos: VideoServer[]
}

interface SeasonEpisodes {
  [episodeNumber: number]: EpisodeVideos
}

interface SeasonData {
  episodes: SeasonEpisodes
}

interface VideosData {
  season: {
    [seasonNumber: number]: SeasonData
  }
}

async function getVideosData(id: string): Promise<VideosData | null> {
  try {
    const response = await fetch(`/api/series/${id}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching videos data:', error)
    return null
  }
}

interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path?: string
  air_date?: string
  runtime?: number
}

interface Season {
  id: number
  name: string
  overview: string
  season_number: number
  episode_count: number
  poster_path?: string
  air_date?: string
}

interface SerieDetails {
  id: number
  name: string
  overview: string
  backdrop_path?: string
  poster_path?: string
  first_air_date?: string
  number_of_seasons?: number
  episode_run_time?: number[]
  vote_average?: number
  genres?: Array<{ id: number; name: string }>
  credits?: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path?: string
    }>
  }
  images?: {
    logos: Array<{
      file_path: string
      iso_639_1?: string
    }>
  }
  content_ratings?: {
    results: Array<{
      iso_3166_1: string
      rating: string
    }>
  }
}

async function getSerieDetails(id: string): Promise<SerieDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR&append_to_response=credits,videos,recommendations,images,content_ratings`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching serie details:', error)
    return null
  }
}

// Fonction pour récupérer les logos de la série
async function getSerieLogos(id: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/images?api_key=${apiKey}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const logos = data.logos || []
    
    if (logos.length === 0) return null
    
    // Priorité: FR > EN > autre langue
    const frLogo = logos.find((logo: any) => logo.iso_639_1 === 'fr')
    if (frLogo) {
      return `https://image.tmdb.org/t/p/original${frLogo.file_path}`
    }
    
    const enLogo = logos.find((logo: any) => logo.iso_639_1 === 'en')
    if (enLogo) {
      return `https://image.tmdb.org/t/p/original${enLogo.file_path}`
    }
    
    // Prendre le premier logo disponible
    const firstLogo = logos[0]
    return `https://image.tmdb.org/t/p/original${firstLogo.file_path}`
  } catch (error) {
    console.error('Error fetching serie logos:', error)
    return null
  }
}

async function getSeasonDetails(serieId: string, seasonNumber: number): Promise<{ episodes: Episode[] } | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${serieId}/season/${seasonNumber}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    return { episodes: data.episodes || [] }
  } catch (error) {
    console.error('Error fetching season details:', error)
    return null
  }
}

// Fonction pour calculer le compte à rebours
function getCountdown(releaseDate: Date, releaseTime?: string): string {
  const now = new Date()
  const target = new Date(releaseDate)
  
  if (releaseTime) {
    const [hours, minutes] = releaseTime.split(':')
    // Convert from UTC+4 (Ocean Indian) to user's timezone
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    // Convert UTC+4 time to UTC
    const utcTime = target.getTime() - (4 * 60 * 60 * 1000)
    
    // Convert to user's local timezone
    const userTime = new Date(utcTime + (now.getTimezoneOffset() * -60 * 1000))
    target.setTime(userTime.getTime())
  } else {
    target.setHours(0, 0, 0, 0)
  }
  
  const diff = target.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Maintenant'
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (days > 0) {
    return `${days}j ${hours}h ${minutes}min`
  } else if (hours > 0) {
    return `${hours}h ${minutes}min ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}min ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Fonction pour formater l'heure locale pour l'affichage
function formatLocalTime(releaseTime: string): string {
  const [hours, minutes] = releaseTime.split(':')
  
  // L'heure dans la BDD est en UTC+4 (La Réunion)
  // Créer une date avec l'heure UTC+4
  const today = new Date()
  const releaseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  releaseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  // La date est déjà en UTC+4, donc on la formate directement selon le fuseau de l'utilisateur
  // Le navigateur convertira automatiquement l'heure UTC+4 vers l'heure locale
  return releaseDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).replace(':', 'h')
}

// Fonction pour récupérer tous les prochains épisodes (pour les badges)
async function getAllUpcomingEpisodes(tmdbId: number): Promise<any[] | null> {
  try {
    // Récupérer d'abord les données brutes
    const { data, error } = await supabase
      .from('series_releases')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .order('release_date', { ascending: true })
      .limit(20) // Récupérer plus pour filtrer

    if (error) {
      console.error('Error fetching all upcoming episodes:', error)
      return null
    }

    if (!data) return null

    // Filtrer côté client pour prendre en compte l'heure
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const userTimezoneOffset = now.getTimezoneOffset() * 60 * 1000 // Offset en millisecondes

    const filteredData = data.filter(episode => {
      const releaseDate = new Date(episode.release_date)
      const episodeDate = releaseDate.toISOString().split('T')[0]

      // Si la date est dans le futur, inclure
      if (episodeDate > today) {
        return true
      }

      // Si c'est aujourd'hui, vérifier l'heure
      if (episodeDate === today && episode.release_time) {
        const [hours, minutes] = episode.release_time.split(':')

        // Créer la date de sortie en UTC+4 (comme stocké en base)
        const utc4Date = new Date(releaseDate)
        utc4Date.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // Convertir UTC+4 vers UTC (soustraire 4 heures)
        const utcDate = new Date(utc4Date.getTime() - (4 * 60 * 60 * 1000))

        // Convertir UTC vers heure locale de l'utilisateur
        const localReleaseTime = new Date(utcDate.getTime() - userTimezoneOffset)

        return localReleaseTime > now
      }

      // Si c'est aujourd'hui sans heure spécifiée, inclure
      if (episodeDate === today && !episode.release_time) {
        return true
      }

      // Sinon, exclure
      return false
    })

    return filteredData.slice(0, 10) // Limiter à 10 résultats
  } catch (error) {
    console.error('Error fetching all upcoming episodes:', error)
    return null
  }
}

// Fonction pour récupérer les prochains épisodes filtrés (pour la logique)
async function getUpcomingEpisodes(tmdbId: number): Promise<any[] | null> {
  try {
    // Récupérer d'abord les données brutes
    const { data, error } = await supabase
      .from('series_releases')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .order('release_date', { ascending: true })
      .limit(20) // Récupérer plus pour filtrer

    if (error) {
      console.error('Error fetching upcoming episodes:', error)
      return null
    }

    if (!data) return null

    // Filtrer côté client pour prendre en compte l'heure
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const userTimezoneOffset = now.getTimezoneOffset() * 60 * 1000 // Offset en millisecondes

    const filteredData = data.filter(episode => {
      const releaseDate = new Date(episode.release_date)
      const episodeDate = releaseDate.toISOString().split('T')[0]

      // Si la date est dans le futur, inclure
      if (episodeDate > today) {
        return true
      }

      // Si c'est aujourd'hui, vérifier l'heure
      if (episodeDate === today && episode.release_time) {
        const [hours, minutes] = episode.release_time.split(':')

        // Créer la date de sortie en UTC+4 (comme stocké en base)
        const utc4Date = new Date(releaseDate)
        utc4Date.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // Convertir UTC+4 vers UTC (soustraire 4 heures)
        const utcDate = new Date(utc4Date.getTime() - (4 * 60 * 60 * 1000))

        // Convertir UTC vers heure locale de l'utilisateur
        const localReleaseTime = new Date(utcDate.getTime() - userTimezoneOffset)

        console.log('Debug upcoming filter:', {
          episode: `${episode.season_number}x${episode.episode_number}`,
          releaseTime: episode.release_time,
          utc4Date: utc4Date.toISOString(),
          utcDate: utcDate.toISOString(),
          localReleaseTime: localReleaseTime.toISOString(),
          now: now.toISOString(),
          isUpcoming: localReleaseTime > now
        })

        return localReleaseTime > now
      }

      // Si c'est aujourd'hui sans heure spécifiée, inclure
      if (episodeDate === today && !episode.release_time) {
        return true
      }

      // Sinon, exclure
      return false
    })

    return filteredData.slice(0, 10) // Limiter à 10 résultats
  } catch (error) {
    console.error('Error fetching upcoming episodes:', error)
    return null
  }
}

// Fonction pour calculer le nombre d'épisodes à partir d'une plage
function getEpisodeCount(episodeNumber: number, episodeRange?: string): number {
  // Si episode_range est défini, calculer le nombre d'épisodes dans la plage
  if (episodeRange) {
    // Si c'est une plage comme "2-8", calculer le nombre d'épisodes
    const match = episodeRange.match(/^(\d+)-(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      return end - start + 1
    }
    // Si c'est un seul numéro, retourner 1
    return 1
  }
  // Sinon, c'est un seul épisode
  return 1
}

// Fonction pour vérifier si c'est une plage avec plusieurs épisodes
function isMultiEpisodeRange(episodeRange?: string): boolean {
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

// Fonction pour obtenir le premier épisode d'une plage
function getFirstEpisodeFromRange(episodeRange?: string): number | null {
  if (!episodeRange) return null
  const match = episodeRange.match(/^(\d+)-(\d+)$/)
  return match ? parseInt(match[1]) : parseInt(episodeRange)
}

// Fonction pour formater les informations d'épisode
function formatEpisodeInfo(seasonNumber: number, episodeNumber: number, episodeRange?: string): string {
  if (episodeRange) {
    const match = episodeRange.match(/^(\d+)-(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      return `S${seasonNumber}E${start}-${end}`
    }
  }
  return `S${seasonNumber}E${episodeNumber}`
}

// Fonction pour formater les informations d'épisode (version courte)
function formatEpisodeInfoShort(seasonNumber: number, episodeNumber: number, episodeRange?: string): string {
  if (episodeRange) {
    const match = episodeRange.match(/^(\d+)-(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      return `E${start}-${end}`
    }
  }
  return `E${episodeNumber}`
}

// Fonction pour créer un slug à partir du titre et de l'ID
function createSlug(title: string, id: number): string {
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${id}-${slug}`
}

export default function SeriePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [id] = (params['id-title'] as string).split('-')
  
  // Récupérer la saison depuis l'URL ou utiliser 1 par défaut
  const seasonFromUrl = searchParams.get('season')
  const initialSeason = seasonFromUrl ? parseInt(seasonFromUrl) : 1
  
  const [serie, setSerie] = useState<SerieDetails | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null)
  const [videosData, setVideosData] = useState<VideosData | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serieLogo, setSerieLogo] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<any[]>([])
  const [upcomingEpisodesFiltered, setUpcomingEpisodesFiltered] = useState<any[]>([])
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({})
  const [frenchRating, setFrenchRating] = useState<string | null>(null)
  const [matureAcknowledged, setMatureAcknowledged] = useState(false)
  const [showMatureWarning, setShowMatureWarning] = useState(false)
  const ratingInfo = useMemo(() => getRatingInfo(frenchRating), [frenchRating])
  const frenchRatingLabel = ratingInfo?.label
  const frenchRatingDescription = ratingInfo?.description
  const isMatureRating = Boolean(ratingInfo?.mature)

  useEffect(() => {
    if (isMatureRating) {
      setShowMatureWarning(!matureAcknowledged)
    } else {
      setShowMatureWarning(false)
      setMatureAcknowledged(false)
    }
  }, [isMatureRating, matureAcknowledged])

  const acknowledgeMatureContent = () => {
    setMatureAcknowledged(true)
    setShowMatureWarning(false)
  }

  // Charger le filtre depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilter = localStorage.getItem('ztv-series-filter-available')
      if (savedFilter === 'true') {
        setShowAvailableOnly(true)
      }
    }
  }, [])

  // Sauvegarder le filtre dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-series-filter-available', showAvailableOnly.toString())
    }
  }, [showAvailableOnly])

  // Détecter si c'est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadSerie = async () => {
      setLoading(true)
      setError(null)
      const serieData = await getSerieDetails(id)
      
      if (!serieData) {
        setError('Série non trouvée')
        setLoading(false)
        return
      }
      
      setSerie(serieData)
      const franceRating = serieData.content_ratings?.results?.find(r => r.iso_3166_1 === 'FR')
      setFrenchRating(franceRating?.rating || null)
      
      // Charger le logo de la série
      const logo = await getSerieLogos(id)
      setSerieLogo(logo)
      
      // Créer la liste des saisons
      if (serieData.number_of_seasons) {
        const seasonsList: Season[] = []
        for (let i = 1; i <= serieData.number_of_seasons; i++) {
          seasonsList.push({
            id: i,
            name: `Saison ${i}`,
            overview: '',
            season_number: i,
            episode_count: 0,
            air_date: ''
          })
        }
        setSeasons(seasonsList)
      }
      
      setLoading(false)
    }
    
    loadSerie()
  }, [id])

  useEffect(() => {
    const loadVideos = async () => {
      const videos = await getVideosData(id)
      setVideosData(videos)
    }
    
    loadVideos()
  }, [id])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!serie) return
      
      setEpisodesLoading(true)
      console.log('Chargement épisodes pour saison:', selectedSeason, 'ID:', id)
      const seasonData = await getSeasonDetails(id.toString(), selectedSeason)
      console.log('Épisodes reçus:', seasonData?.episodes?.length || 0)
      setEpisodes(seasonData?.episodes || [])
      setEpisodesLoading(false)
    }
    
    if (serie) {
      loadEpisodes()
    }
  }, [serie, selectedSeason, id])

  useEffect(() => {
    const loadUpcomingEpisodes = async () => {
      if (!serie) return

      // Charger les épisodes pour les badges (non filtrés)
      const upcomingForBadges = await getAllUpcomingEpisodes(serie.id)
      setUpcomingEpisodes(upcomingForBadges || [])

      // Charger les épisodes filtrés pour la logique
      const upcomingFiltered = await getUpcomingEpisodes(serie.id)
      setUpcomingEpisodesFiltered(upcomingFiltered || [])
    }

    if (serie) {
      loadUpcomingEpisodes()
    }
  }, [serie])

  // Update countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: { [key: string]: string } = {}
      
      upcomingEpisodes.forEach((episode) => {
        const releaseDate = new Date(episode.release_date)
        newCountdowns[episode.id] = getCountdown(releaseDate, episode.release_time)
      })
      
      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)

    return () => clearInterval(interval)
  }, [upcomingEpisodes])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!serie || error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-lg mb-4">{error || 'Série non trouvée'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    )
  }

  const backdropUrl = serie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}`
    : null
  
  const posterUrl = serie.poster_path
    ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
    : null

  const toggleEpisode = (episodeId: number) => {
    setExpandedEpisode(expandedEpisode === episodeId ? null : episodeId)
  }

  // Fonction pour vérifier si un épisode a des vidéos disponibles
  const hasVideos = (episodeNumber: number) => {
    if (!videosData || !videosData.season) return false
    const episodeVideos = videosData.season[selectedSeason]?.episodes[episodeNumber]?.videos
    return episodeVideos && episodeVideos.length > 0
  }

  // Fonction pour vérifier si un épisode doit être affiché selon le filtre
  const shouldShowEpisode = (episode: Episode) => {
    // Si le filtre n'est pas activé, afficher tous les épisodes
    if (!showAvailableOnly) return true

    // Si le filtre est activé, afficher si:
    // 1. L'épisode a des vidéos disponibles, OU
    // 2. L'épisode fait partie d'une sortie à venir (même si elle a eu lieu aujourd'hui)
    const hasVideoAvailable = hasVideos(episode.episode_number)
    const isUpcoming = upcomingEpisodes.some(
      ue => ue.season_number === selectedSeason &&
      (ue.episode_number === episode.episode_number ||
       (ue.episode_range && isEpisodeInRange(episode.episode_number, ue.episode_range)))
    )

    return hasVideoAvailable || isUpcoming
  }

  // Fonction pour vérifier si un épisode est à venir (pas encore disponible)
  const isEpisodeUpcoming = (episode: Episode) => {
    const upcomingRelease = upcomingEpisodes.find(
      ue => ue.season_number === selectedSeason &&
      (ue.episode_number === episode.episode_number ||
       (ue.episode_range && isEpisodeInRange(episode.episode_number, ue.episode_range)))
    )

    if (!upcomingRelease) return false

    // Si c'est aujourd'hui, vérifier l'heure aussi
    const releaseDate = new Date(upcomingRelease.release_date)
    const today = new Date()
    const isToday = releaseDate.toDateString() === today.toDateString()

    if (isToday && upcomingRelease.release_time) {
      const [hours, minutes] = upcomingRelease.release_time.split(':')
      releaseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Convertir l'heure UTC+4 en heure locale
      const localReleaseTime = new Date(releaseDate.getTime() - (4 * 60 * 60 * 1000))
      return localReleaseTime > today
    }

    // Si c'est dans le futur ou aujourd'hui sans heure spécifiée, c'est à venir
    return releaseDate >= today || isToday
  }

  // Fonction pour vérifier si un épisode est dans une plage
  const isEpisodeInRange = (episodeNumber: number, episodeRange: string): boolean => {
    const match = episodeRange.match(/^(\d+)-(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      return episodeNumber >= start && episodeNumber <= end
    }
    return episodeNumber === parseInt(episodeRange)
  }

  // Fonction pour obtenir la sortie à venir d'un épisode
  const getEpisodeUpcomingRelease = (episode: Episode) => {
    return upcomingEpisodes.find(
      ue => ue.season_number === selectedSeason && 
      (ue.episode_number === episode.episode_number || 
       (ue.episode_range && isEpisodeInRange(episode.episode_number, ue.episode_range)))
    )
  }

  // Mettre à jour l'URL quand la saison change
  const updateSeasonInUrl = (seasonNumber: number) => {
    const url = new URL(window.location.href)
    if (seasonNumber === 1) {
      url.searchParams.delete('season')
    } else {
      url.searchParams.set('season', seasonNumber.toString())
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Gérer le changement de saison
  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber)
    updateSeasonInUrl(seasonNumber)
  }

  // Vider le cache
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      // Vider aussi les cookies si nécessaire
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      })
      alert('Cache et données locales vidés avec succès!')
      window.location.reload()
    }
  }

  return (
    <>
      <PageHead
        title={`${serie.name} (${serie.first_air_date?.split('-')[0]}) | ZTVPlus `}
        description={serie.overview || `Regardez ${serie.name} en streaming HD gratuit sur ZTVPlus. ${serie.number_of_seasons ? `${serie.number_of_seasons} saison${serie.number_of_seasons > 1 ? 's' : ''}.` : ''} ${serie.genres?.map(g => g.name).slice(0, 3).join(', ') || ''}`}
        keywords={[
          serie.name,
          'streaming',
          'gratuit',
          'série',
          'VF',
          'VOSTFR',
          ...(serie.genres?.map(g => g.name.toLowerCase()) || []),
          serie.first_air_date?.split('-')[0]
        ].filter(Boolean).join(', ')}
        image={serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : '/og-default.jpg'}
        url={currentUrl}
        type="series"
        releaseDate={serie.first_air_date}
        genres={serie.genres?.map(g => g.name)}
      />
      <div className="min-h-screen bg-black text-white relative">
        {showMatureWarning && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-8">
            <div className="max-w-lg space-y-4 rounded-2xl border border-white/20 bg-black/80 p-6 text-center shadow-xl shadow-black/40">
              <p className="text-xs uppercase tracking-[0.4em] text-red-400">Avertissement</p>
              <h2 className="text-2xl font-bold">Mature Audience Only (TV-MA)</h2>
              <p className="text-sm text-gray-300">
                Contenu réservé aux adultes (17+). Peut contenir :
              </p>
              <ul className="mx-auto max-w-[280px] space-y-1 text-left text-xs text-gray-300">
                <li>• Violence forte</li>
                <li>• Sexualité explicite</li>
                <li>• Langage très grossier</li>
                <li>• Scènes sensibles</li>
              </ul>
              <button
                onClick={acknowledgeMatureContent}
                className="w-full rounded-full bg-emerald-500/90 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Je confirme avoir 17 ans ou plus
              </button>
              {frenchRatingDescription && (
                <p className="text-[11px] text-gray-400">{frenchRatingDescription}</p>
              )}
            </div>
          </div>
        )}
        <div className={showMatureWarning ? 'pointer-events-none filter blur-sm' : ''}>
          {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-4 z-50 p-3 bg-gray-800/80 backdrop-blur rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title="Paramètres"
      >
        <Settings size={20} />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Paramètres</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Filter Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Filtre des épisodes</h3>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Se souvenir du filtre "Disponibles uniquement"</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${showAvailableOnly ? 'text-sky-400' : 'text-gray-500'}`}>
                      {showAvailableOnly ? 'Activé' : 'Désactivé'}
                    </span>
                    <button
                      onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAvailableOnly ? 'bg-sky-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAvailableOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Le choix est sauvegardé automatiquement et sera appliqué lors de votre prochaine visite.
                </p>
              </div>

              {/* Cache Management */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Gestion du cache</h3>
                <button
                  onClick={clearCache}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  <Trash2 size={16} />
                  Vider le cache et les données locales
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Supprime toutes les données locales, le cache et les cookies. La page se rechargera automatiquement.
                </p>
              </div>

              {/* App Information */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Info size={16} />
                  Informations de l'application
                </h3>
                <div className="space-y-2 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Application:</span>
                    <span className="text-white">ZTVPlus</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">2.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Build:</span>
                    <span className="text-white">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Framework:</span>
                    <span className="text-white">Next.js 15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Navigateur:</span>
                    <span className="text-white">
                      {typeof window !== 'undefined' ? navigator.userAgent.split(' ').slice(-2)[0] : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {backdropUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </div>
        )}
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-end px-4 sm:px-6 lg:px-8 pb-8">
          <div className="w-full">
            <div className="flex flex-col gap-8 items-start max-w-5xl">
              {/* Info */}
              <div className="pb-4 lg:pb-8">
                {/* Logo ou Titre */}
                {serieLogo ? (
                  <div className="mb-4">
                    <img 
                      src={serieLogo} 
                      alt={serie.name}
                      className="h-20 lg:h-32 object-contain"
                    />
                  </div>
                ) : (
                  <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                    {serie.name}
                  </h1>
                )}
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 max-h-16 sm:max-h-none overflow-hidden">
                  <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-xs sm:text-sm">
                    {serie.first_air_date?.split('-')[0]}
                  </span>
                  {serie.number_of_seasons && (
                    <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-xs sm:text-sm">
                      {serie.number_of_seasons} saison{serie.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )}
                  {serie.episode_run_time && serie.episode_run_time[0] && (
                    <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-xs sm:text-sm">
                      {serie.episode_run_time[0]}min
                    </span>
                  )}
                  {frenchRatingLabel && (
                    <span className="px-3 py-1 bg-black border border-white/30 rounded-full text-xs sm:text-sm">
                      <span className="text-emerald-400 font-semibold leading-none">{frenchRatingLabel}</span>
                      {frenchRating && (
                        <span className="text-gray-400 ml-2 uppercase text-[10px] tracking-wide">{frenchRating}</span>
                      )}
                    </span>
                  )}
                  <span className="flex items-center px-3 py-1 bg-black border border-white/30 rounded-full text-xs sm:text-sm">
                    <Star className="text-yellow-400 mr-1" size={14} />
                    <span className="font-medium">{serie.vote_average?.toFixed(1)}</span>
                  </span>
                  <ShareButton 
                    title={serie.name}
                    url={currentUrl}
                    type="series"
                    className="hidden sm:flex"
                  />
                </div>
                
                {/* Genres */}
                {serie.genres && serie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 max-h-12 sm:max-h-none overflow-hidden">
                    {serie.genres.slice(0, isMobile ? 2 : serie.genres.length).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2 py-1 bg-black border border-white/30 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                    {isMobile && serie.genres.length > 2 && (
                      <span className="px-2 py-1 bg-black border border-white/30 rounded-full text-xs">
                        +{serie.genres.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Upcoming Episodes Badges */}
                {upcomingEpisodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {upcomingEpisodes.slice(0, 3).map((episode) => {
                      const releaseDate = new Date(episode.release_date)
                      const today = new Date()
                      const daysUntil = Math.ceil((releaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      const episodeCount = getEpisodeCount(episode.episode_number, episode.episode_range)
                      const episodeInfo = formatEpisodeInfoShort(episode.season_number, episode.episode_number, episode.episode_range)
                      
                      return (
                        <div key={episode.id}>
                          <div 
                            className="px-3 py-2 bg-gradient-to-r from-sky-600/20 to-blue-600/20 border border-sky-500/30 rounded-full text-xs sm:text-sm backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-blue-400 font-medium">
                                {episodeInfo}
                              </span>
                              <span className="text-blue-400">
                                {episodeCount > 1 ? `(${episodeCount} ép)` : 'sort'}
                              </span>
                              <span className="text-blue-400 font-medium">
                                {daysUntil === 0 ? 'aujourd\'hui' : 
                                 daysUntil === 1 ? 'demain' : 
                                 daysUntil <= 7 ? `dans ${daysUntil}j` : 
                                 releaseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                              {episode.release_time && (
                                <>
                                  <span className="text-blue-400">
                                    à
                                  </span>
                                  <span className="text-blue-400 font-medium">
                                    {formatLocalTime(episode.release_time)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {upcomingEpisodes.length > 3 && (
                      <div className="px-3 py-2 bg-black/40 border border-white/20 rounded-full text-xs sm:text-sm">
                        <span className="text-white/60">
                          +{upcomingEpisodes.length - 3} sortie{upcomingEpisodes.length - 3 > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Overview */}
                <div className="max-w-4xl">
                  <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-4 line-clamp-2 sm:line-clamp-none">
                    {serie.overview || 'Aucun synopsis disponible.'}
                  </p>
                  
                  {/* Message d'épisodes disponibles */}
                  {(() => {
                    console.log('Debug - episodes:', episodes.length, 'videosData:', videosData ? 'loaded' : 'not loaded', 'selectedSeason:', selectedSeason)
                    
                    if (episodesLoading) {
                      return (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-600/20 to-sky-600/20 border border-blue-500/30 rounded-lg backdrop-blur-sm w-full">
                          <p className="text-blue-300 text-center">
                            Vérification des épisodes disponibles...
                          </p>
                        </div>
                      )
                    }
                    
                    const availableEpisodes = episodes.filter(ep => hasVideos(ep.episode_number))
                    console.log('Debug - availableEpisodes:', availableEpisodes.length)
                    
                    if (availableEpisodes.length > 0) {
                      const episodeCount = availableEpisodes.length
                      const totalEpisodes = episodes.length
                      const isCompleteSeason = episodeCount === totalEpisodes && totalEpisodes > 0
                      
                      return (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg backdrop-blur-sm w-full">
                          <p className="text-white font-bold text-lg sm:text-xl text-center sm:text-left">
                            {isCompleteSeason 
                              ? `Saison ${selectedSeason} complète disponible dès maintenant!`
                              : episodeCount === 1
                                ? `Saison ${selectedSeason} - ${episodeCount} épisode disponible dès maintenant!`
                                : `Saison ${selectedSeason} - ${episodeCount} épisodes disponibles dès maintenant!`
                            }
                          </p>
                          <p className="text-green-300 text-sm sm:text-base text-center sm:text-left mt-1">
                            {serie.name} • {episodeCount}/{totalEpisodes} épisodes
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Seasons and Episodes Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl">
          {/* Season Selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Saisons</h2>
              
              {/* Netflix-style Season Selector */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                    className="appearance-none bg-black border border-white/30 rounded-full px-4 py-2 pr-10 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 cursor-pointer hover:bg-gray-900 transition-all duration-200"
                  >
                    {seasons.map((season) => (
                      <option key={season.id} value={season.season_number} className="bg-gray-900 text-white">
                        {season.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom Arrow */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Filter Button */}
                <button
                  onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                  className={`p-2 rounded-full border transition-all duration-200 ${
                    showAvailableOnly 
                      ? 'bg-black border-white text-white hover:bg-gray-900 shadow-lg shadow-white/10' 
                      : 'bg-black border-white/30 text-gray-400 hover:bg-gray-900 hover:border-white/50 hover:text-white'
                  }`}
                  title={showAvailableOnly ? "Afficher tous les épisodes" : "Afficher uniquement les épisodes disponibles"}
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {/* Bouton de demande - positionné haut */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/50 rounded-xl p-4">
                <MessageCircle size={18} className="text-cyan-400" />
                <span className="text-cyan-300 text-sm">Il manque des épisodes ?</span>
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="ml-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-[1.02] border border-cyan-500/50"
                >
                  Demander les épisodes
                </button>
              </div>
            </div>

            {/* Streaming Disclaimer - Only show when no episodes are available */}
            {(() => {
              const availableEpisodes = episodes.filter(ep => hasVideos(ep.episode_number))
              return availableEpisodes.length === 0 && !episodesLoading ? <StreamingDisclaimer /> : null
            })()}

            {/* Episodes List */}
            {episodesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Chargement des épisodes...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {episodes
                  .filter(episode => shouldShowEpisode(episode))
                  .map((episode) => {
                    // Obtenir la sortie à venir pour cet épisode
                    const upcomingRelease = getEpisodeUpcomingRelease(episode)
                    
                    return (
                      <div 
                        key={episode.id} 
                        className={`bg-black rounded-lg overflow-hidden border ${
                          isEpisodeUpcoming(episode) 
                            ? 'border-orange-500/30 bg-orange-950/20' 
                            : 'border-white/20'
                        }`}
                      >
                    <div className="p-4">
                      {/* Mobile Layout: Image on top */}
                      <div className="sm:hidden">
                        {/* Episode Thumbnail */}
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w780${episode.still_path}`}
                            alt={episode.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                            <Tv size={32} className="text-gray-600" />
                          </div>
                        )}
                        
                        {/* Episode Info */}
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {hasVideos(episode.episode_number) ? (
                                <Link 
                                  href={`/watch/series/${id}/${selectedSeason}/${episode.episode_number}`}
                                  className="block group"
                                >
                                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-sky-400 transition-colors cursor-pointer">
                                    Épisode {episode.episode_number}: {episode.name}
                                  </h3>
                                </Link>
                              ) : (
                                <h3 className={`text-lg font-semibold mb-1 cursor-default ${
                                  isEpisodeUpcoming(episode) 
                                    ? 'text-orange-400' 
                                    : 'text-gray-500'
                                }`}>
                                  Épisode {episode.episode_number}: {episode.name}
                                </h3>
                              )}
                              
                              {/* Badge pour épisode à venir */}
                              {upcomingRelease && !hasVideos(episode.episode_number) && (
                                <div className="mt-1">
                                  <span className="px-2 py-1 bg-orange-600/20 border border-orange-500/30 rounded-full text-xs text-orange-400 font-medium">
                                    À venir{upcomingRelease.release_time ? ` ${formatLocalTime(upcomingRelease.release_time)}` : ''}
                                  </span>
                                </div>
                              )}
                              
                              {/* Multi-episode release info */}
                              {upcomingRelease && upcomingRelease.episode_range && (
                                <div className="mt-1">
                                  <span className="px-2 py-1 bg-sky-600/20 border border-sky-500/30 rounded-full text-xs text-sky-400 font-medium">
                                    Sortie {formatEpisodeInfoShort(upcomingRelease.season_number, upcomingRelease.episode_number, upcomingRelease.episode_range)}
                                    {getEpisodeCount(upcomingRelease.episode_number, upcomingRelease.episode_range) > 1 && 
                                      ` (${getEpisodeCount(upcomingRelease.episode_number, upcomingRelease.episode_range)} épisodes)`}
                                    {upcomingRelease.release_time && ` à ${formatLocalTime(upcomingRelease.release_time)}`}
                                  </span>
                                </div>
                              )}
                              
                              {/* Countdown Timer for this episode */}
                              {(() => {
                                const upcomingEpisode = upcomingEpisodes.find(
                                  ue => ue.season_number === selectedSeason && ue.episode_number === episode.episode_number
                                )
                                if (upcomingEpisode && countdowns[upcomingEpisode.id]) {
                                  return (
                                    <div className="mt-2">
                                      <span className="px-2 py-1 bg-black/40 border border-white/20 rounded-full text-xs text-blue-400 font-medium">
                                        {countdowns[upcomingEpisode.id]}
                                      </span>
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {hasVideos(episode.episode_number) ? (
                                <Link 
                                  href={`/watch/series/${id}/${selectedSeason}/${episode.episode_number}`}
                                  className="p-2 text-sky-400 hover:text-sky-300 hover:bg-sky-900/20 rounded-lg transition-colors"
                                  title="Lire l'épisode"
                                >
                                  <Play size={16} />
                                </Link>
                              ) : (
                                <div 
                                  className="p-2 text-gray-600 cursor-not-allowed rounded-lg"
                                  title="Épisode non disponible"
                                >
                                  <Play size={16} />
                                </div>
                              )}
                              
                              <button
                                onClick={() => toggleEpisode(episode.id)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                              >
                                {expandedEpisode === episode.id ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            {episode.air_date && (
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(episode.air_date).toLocaleDateString('fr-FR')}</span>
                              </div>
                            )}
                            {episode.runtime && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{episode.runtime}min</span>
                              </div>
                            )}
                          </div>
                          
                          {episode.overview && (
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                              {episode.overview}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Desktop Layout: Side by side */}
                      <div className="hidden sm:flex gap-4">
                        {/* Episode Thumbnail */}
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w780${episode.still_path}`}
                            alt={episode.name}
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gray-900 rounded-lg flex items-center justify-center">
                            <Tv size={24} className="text-gray-600" />
                          </div>
                        )}
                        
                        {/* Episode Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {hasVideos(episode.episode_number) ? (
                                <Link 
                                  href={`/watch/series/${id}/${selectedSeason}/${episode.episode_number}`}
                                  className="block group"
                                >
                                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-sky-400 transition-colors cursor-pointer">
                                    Épisode {episode.episode_number}: {episode.name}
                                  </h3>
                                </Link>
                              ) : (
                                <h3 className={`text-lg font-semibold mb-1 cursor-default ${
                                  isEpisodeUpcoming(episode) 
                                    ? 'text-orange-400' 
                                    : 'text-gray-500'
                                }`}>
                                  Épisode {episode.episode_number}: {episode.name}
                                </h3>
                              )}
                              
                              {/* Badge pour épisode à venir */}
                              {upcomingRelease && !hasVideos(episode.episode_number) && (
                                <div className="mb-2">
                                  <span className="px-2 py-1 bg-orange-600/20 border border-orange-500/30 rounded-full text-xs text-orange-400 font-medium">
                                    À venir{upcomingRelease.release_time ? ` ${formatLocalTime(upcomingRelease.release_time)}` : ''}
                                  </span>
                                </div>
                              )}
                              
                              {/* Multi-episode release info */}
                              {upcomingRelease && upcomingRelease.episode_range && (
                                <div className="mb-2">
                                  <span className="px-2 py-1 bg-sky-600/20 border border-sky-500/30 rounded-full text-xs text-sky-400 font-medium">
                                    Sortie {formatEpisodeInfoShort(upcomingRelease.season_number, upcomingRelease.episode_number, upcomingRelease.episode_range)}
                                    {getEpisodeCount(upcomingRelease.episode_number, upcomingRelease.episode_range) > 1 && 
                                      ` (${getEpisodeCount(upcomingRelease.episode_number, upcomingRelease.episode_range)} épisodes)`}
                                    {upcomingRelease.release_time && ` à ${formatLocalTime(upcomingRelease.release_time)}`}
                                  </span>
                                </div>
                              )}
                              
                              {/* Countdown Timer for this episode */}
                              {(() => {
                                const upcomingEpisode = upcomingEpisodes.find(
                                  ue => ue.season_number === selectedSeason && ue.episode_number === episode.episode_number
                                )
                                if (upcomingEpisode && countdowns[upcomingEpisode.id]) {
                                  return (
                                    <div className="mb-2">
                                      <span className="px-2 py-1 bg-black/40 border border-white/20 rounded-full text-xs text-blue-400 font-medium">
                                        {countdowns[upcomingEpisode.id]}
                                      </span>
                                    </div>
                                  )
                                }
                                return null
                              })()}
                              
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                {episode.air_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{new Date(episode.air_date).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                )}
                                {episode.runtime && (
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>{episode.runtime}min</span>
                                  </div>
                                )}
                              </div>
                              {episode.overview && (
                                <p className="text-gray-300 text-sm line-clamp-2">
                                  {episode.overview}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {hasVideos(episode.episode_number) ? (
                                <Link 
                                  href={`/watch/series/${id}/${selectedSeason}/${episode.episode_number}`}
                                  className="p-2 text-sky-400 hover:text-sky-300 hover:bg-sky-900/20 rounded-lg transition-colors"
                                  title="Lire l'épisode"
                                >
                                  <Play size={16} />
                                </Link>
                              ) : (
                                <div 
                                  className="p-2 text-gray-600 cursor-not-allowed rounded-lg"
                                  title="Épisode non disponible"
                                >
                                  <Play size={16} />
                                </div>
                              )}
                              
                              <button
                                onClick={() => toggleEpisode(episode.id)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                              >
                                {expandedEpisode === episode.id ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedEpisode === episode.id && episode.overview && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <p className="text-gray-300 leading-relaxed">
                            {episode.overview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </div>

          </div>

          {/* Streaming Disclaimer - Only show when no episodes are available */}
          {(() => {
            const availableEpisodes = episodes.filter(ep => hasVideos(ep.episode_number))
            return availableEpisodes.length === 0 && !episodesLoading ? <StreamingDisclaimer /> : null
          })()}

          {/* Cast */}
          {serie.credits?.cast && serie.credits.cast.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8">Distribution principale</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {serie.credits.cast.slice(0, 12).map((person) => (
                  <div key={person.id} className="text-center group">
                    <div className="w-full aspect-square bg-black border border-white/20 rounded-full mb-3 overflow-hidden">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <span className="text-xs">No photo</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white">{person.name}</p>
                    <p className="text-xs text-gray-400">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Series Request Modal */}
    <SeriesRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        seriesTitle={serie.name}
        seriesId={serie.id}
      />
    </>
  )
}
