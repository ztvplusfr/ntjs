'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Play, Calendar, Clock, Star, ChevronDown, ChevronUp, Tv, Filter, Settings, Trash2, Info } from 'lucide-react'
import Link from 'next/link'
import ShareButton from '@/components/share-button'
import PageHead from '@/components/page-head'

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
}

async function getSerieDetails(id: string): Promise<SerieDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR&append_to_response=credits,videos,recommendations`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching serie details:', error)
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
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <div className="min-h-screen bg-black text-white">
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
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
          </div>
        )}
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-end px-4 sm:px-6 lg:px-8 pb-8">
          <div className="w-full">
            <div className="flex flex-col gap-8 items-start max-w-5xl">
              {/* Info */}
              <div className="pb-4 lg:pb-8">
                <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                  {serie.name}
                </h1>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                    {serie.first_air_date?.split('-')[0]}
                  </span>
                  {serie.number_of_seasons && (
                    <span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                      {serie.number_of_seasons} saison{serie.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )}
                  {serie.episode_run_time && serie.episode_run_time[0] && (
                    <span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                      {serie.episode_run_time[0]}min
                    </span>
                  )}
                  <span className="flex items-center px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm">
                    <Star className="text-yellow-400 mr-1" size={16} />
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
                  <div className="flex flex-wrap gap-2 mb-6">
                    {serie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-gray-700/60 backdrop-blur rounded-full text-sm border border-gray-600"
                      >
                        {genre.name}
                      </span>
                    ))}
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
                    className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    {seasons.map((season) => (
                      <option key={season.id} value={season.season_number}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom Arrow */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Filter Button */}
                <button
                  onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                  className={`p-2 rounded-lg transition-colors ${
                    showAvailableOnly 
                      ? 'bg-sky-600 text-white hover:bg-sky-700' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={showAvailableOnly ? "Afficher tous les épisodes" : "Afficher uniquement les épisodes disponibles"}
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {/* Episodes List */}
            {episodesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Chargement des épisodes...</p>
              </div>
            ) : (
              <>
              <div className="space-y-4">
                {episodes
                  .filter(episode => !showAvailableOnly || hasVideos(episode.episode_number))
                  .map((episode) => (
                  <div key={episode.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
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
                          <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
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
                                <h3 className="text-lg font-semibold text-gray-500 mb-1 cursor-default">
                                  Épisode {episode.episode_number}: {episode.name}
                                </h3>
                              )}
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
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                          <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
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
                                <h3 className="text-lg font-semibold text-gray-500 mb-1 cursor-default">
                                  Épisode {episode.episode_number}: {episode.name}
                                </h3>
                              )}
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
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                      </div>
                      
                      {/* Expanded Content */}
                      {expandedEpisode === episode.id && episode.overview && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <p className="text-gray-300 leading-relaxed">
                            {episode.overview}
                          </p>
                        </div>
                      )}
                    </div>
                ))}
              </div>
              
              {/* Message quand aucun épisode disponible avec le filtre */}
              {showAvailableOnly && episodes.filter(episode => hasVideos(episode.episode_number)).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-white">Aucun épisode disponible</h3>
                  <p className="text-gray-400">Aucun épisode de cette saison n'est disponible en streaming pour le moment.</p>
                </div>
              )}
              </>
            )}
          </div>
          
          {/* Cast */}
          {serie.credits?.cast && serie.credits.cast.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8">Distribution principale</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {serie.credits.cast.slice(0, 12).map((person) => (
                  <div key={person.id} className="text-center group">
                    <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 overflow-hidden">
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
    </>
  )
}
