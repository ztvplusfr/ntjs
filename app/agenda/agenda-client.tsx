'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Fonctions pour formater les épisodes avec gestion des plages
const formatEpisodeInfo = (season: number, episode: number, episodeRange?: string) => {
  // Si episode_range est défini, l'utiliser
  if (episodeRange) {
    return `S${season.toString().padStart(2, '0')}E${episodeRange}`
  }
  // Sinon utiliser le format standard
  return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`
}

// Fonction pour calculer le nombre d'épisodes à partir d'une plage
const getEpisodeCount = (episodeNumber: number, episodeRange?: string) => {
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

const getFirstEpisodeFromRange = (episodeRange?: string) => {
  if (!episodeRange) return null
  // Si c'est une plage comme "1-6", extraire le premier numéro
  const match = episodeRange.match(/^(\d+)-/)
  return match ? parseInt(match[1]) : parseInt(episodeRange)
}

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

// Fonction pour obtenir les dates de la semaine en fonction d'une date de référence
function getWeekDates(referenceDate = new Date()) {
  const today = new Date(referenceDate)
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    weekDates.push(date)
  }
  
  return weekDates
}

// Fonction pour naviguer vers une autre semaine
function navigateWeek(currentWeekDates: Date[], direction: 'prev' | 'next') {
  const referenceMonday = currentWeekDates[0]
  const newReferenceDate = new Date(referenceMonday)
  
  if (direction === 'prev') {
    newReferenceDate.setDate(referenceMonday.getDate() - 7)
  } else {
    newReferenceDate.setDate(referenceMonday.getDate() + 7)
  }
  
  return getWeekDates(newReferenceDate)
}

// Helper function to get series details
async function getSeriesDetails(tmdbId: number) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}

// Helper function to get week date range
function getWeekDateRange(weekDates: Date[]) {
  const firstDay = weekDates[0]
  const lastDay = weekDates[6]
  
  const firstDayFormatted = firstDay.toLocaleDateString('fr-FR', { day: 'numeric' })
  const lastDayFormatted = lastDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  
  return `du ${firstDayFormatted} au ${lastDayFormatted}`
}

// Helper function to format day
function formatDay(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function isToday(date: Date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export default function AgendaClient({ seriesReleases, weekDates: initialWeekDates }: { seriesReleases: any[], weekDates: Date[] }) {
  // État pour gérer les semaines dynamiquement
  const [currentWeekDates, setCurrentWeekDates] = useState(initialWeekDates)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date()
    return currentWeekDates.findIndex(date => isToday(date))
  })
  const [releasesByDate, setReleasesByDate] = useState(new Map())
  const [loading, setLoading] = useState(true)
  
  // Fonction pour naviguer entre les semaines
  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    const newWeekDates = navigateWeek(currentWeekDates, direction)
    setCurrentWeekDates(newWeekDates)
    // Réinitialiser la sélection au premier jour de la nouvelle semaine
    setSelectedDayIndex(0)
  }
  
  // Fonction pour revenir à la semaine actuelle
  const goToCurrentWeek = () => {
    const currentWeek = getWeekDates(new Date())
    setCurrentWeekDates(currentWeek)
    const todayIndex = currentWeek.findIndex(date => isToday(date))
    setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0)
  }
  
  // Group releases by date and fetch series details
  useEffect(() => {
    const processData = async () => {
      setLoading(true)
      const newReleasesByDate = new Map()
      const seriesDetailsCache = new Map()
      
      if (seriesReleases && seriesReleases.length > 0) {
        console.log('Processing releases:', seriesReleases.length)
        
        for (const release of seriesReleases) {
          const releaseDate = new Date(release.release_date)
          const dateKey = releaseDate.toISOString().split('T')[0]
          
          // Get series details from cache or fetch from TMDB
          if (!seriesDetailsCache.has(release.tmdb_id)) {
            const seriesDetails = await getSeriesDetails(release.tmdb_id)
            seriesDetailsCache.set(release.tmdb_id, seriesDetails)
          }
          
          if (!newReleasesByDate.has(dateKey)) {
            newReleasesByDate.set(dateKey, [])
          }
          
          newReleasesByDate.get(dateKey).push({
            ...release,
            seriesDetails: seriesDetailsCache.get(release.tmdb_id)
          })
        }
        
        // Trier les releases de chaque jour par heure (plus récentes en premier)
        for (const [dateKey, releases] of newReleasesByDate.entries()) {
          releases.sort((a: any, b: any) => {
            // Si les deux ont une heure, comparer par heure
            if (a.release_time && b.release_time) {
              return a.release_time.localeCompare(b.release_time)
            }
            // Si seulement un a une heure, celui avec l'heure vient en premier
            if (a.release_time && !b.release_time) return -1
            if (!a.release_time && b.release_time) return 1
            // Si aucun n'a d'heure, garder l'ordre original
            return 0
          })
        }
        
        console.log('Processed releases by date:', newReleasesByDate)
      }
      
      setReleasesByDate(newReleasesByDate)
      setLoading(false)
    }
    
    processData()
  }, [seriesReleases])
  
  const currentDay = currentWeekDates[selectedDayIndex]
  const dateKey = currentDay.toISOString().split('T')[0]
  const dayReleases = releasesByDate.get(dateKey) || []
  const isCurrentDay = isToday(currentDay)
  
  console.log('Current day:', currentDay, 'Releases:', dayReleases.length)
  
  const handlePreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1)
    } else {
      // Si on est au premier jour, naviguer vers la semaine précédente
      handleWeekNavigation('prev')
      setSelectedDayIndex(6) // Dernier jour de la semaine précédente
    }
  }
  
  const handleNextDay = () => {
    if (selectedDayIndex < currentWeekDates.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1)
    } else {
      // Si on est au dernier jour, naviguer vers la semaine suivante
      handleWeekNavigation('next')
      setSelectedDayIndex(0) // Premier jour de la semaine suivante
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Agenda des sorties</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Découvrez les prochaines sorties d'épisodes de vos séries préférées
          </p>
        </div>

        {/* Week Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleWeekNavigation('prev')}
              className="p-2 rounded-full bg-black border border-white/20 text-white hover:bg-gray-900 transition-colors"
              title="Semaine précédente"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="text-lg sm:text-xl font-semibold text-center flex-1">
              Semaine {getWeekDateRange(currentWeekDates)}
            </h2>
            
            <button
              onClick={() => handleWeekNavigation('next')}
              className="p-2 rounded-full bg-black border border-white/20 text-white hover:bg-gray-900 transition-colors"
              title="Semaine suivante"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Bouton pour revenir à la semaine actuelle si on n'y est pas */}
          {!currentWeekDates.some(date => isToday(date)) && (
            <div className="text-center mb-4">
              <button
                onClick={goToCurrentWeek}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Revenir à cette semaine
              </button>
            </div>
          )}
          
          {/* Desktop Week View */}
          <div className="hidden sm:grid grid-cols-7 gap-2 mb-8">
            {currentWeekDates.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0]
              const dayReleases = releasesByDate.get(dateKey) || []
              const isCurrentDay = isToday(date)
              
              // Calculer le nombre total d'épisodes en tenant compte des plages
              const totalEpisodes = dayReleases.reduce((sum: number, release: any) => {
                return sum + getEpisodeCount(release.episode_number, release.episode_range)
              }, 0)
              
              return (
                <div key={dateKey} className="text-center">
                  <div 
                    className={`text-center p-3 rounded-lg border transition-all duration-200 ${
                      isCurrentDay 
                        ? 'bg-red-600/20 border-red-600/40' 
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {formatDay(date)}
                    </div>
                    <div className={`text-lg font-bold ${
                      isCurrentDay ? 'text-white' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                      totalEpisodes > 0 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/40' 
                        : 'bg-gray-700/50 text-gray-500 border border-gray-600/40'
                    }`}>
                      {totalEpisodes} épisode{totalEpisodes > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Mobile Day Navigation */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousDay}
                disabled={selectedDayIndex === 0}
                className={`p-2 rounded-full transition-colors ${
                  selectedDayIndex === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-black border border-white/20 text-white hover:bg-gray-900'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 text-center mx-4">
                <div className={`px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  isCurrentDay 
                    ? 'bg-red-600/20 border-red-600/40' 
                    : 'bg-black/40 border-white/20'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-medium ${
                      isCurrentDay ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {currentDay.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </span>
                    <span className={`text-base font-bold ${
                      isCurrentDay ? 'text-white' : 'text-white'
                    }`}>
                      {currentDay.getDate()}
                    </span>
                  </div>
                  {dayReleases.length > 0 && (
                    <div className={`text-xs px-1 py-0.5 rounded-full mt-1 ${
                      dayReleases.length > 0 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/40' 
                        : 'bg-gray-700/50 text-gray-500 border border-gray-600/40'
                    }`}>
                      {(() => {
                        // Calculer le nombre total d'épisodes en tenant compte des plages
                        const totalEpisodes = dayReleases.reduce((sum: number, release: any) => {
                          return sum + getEpisodeCount(release.episode_number, release.episode_range)
                        }, 0)
                        return totalEpisodes
                      })()}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleNextDay}
                disabled={selectedDayIndex === currentWeekDates.length - 1}
                className={`p-2 rounded-full transition-colors ${
                  selectedDayIndex === currentWeekDates.length - 1
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-black border border-white/20 text-white hover:bg-gray-900'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="space-y-4 sm:space-y-8">
          {/* Mobile: Show only selected day */}
          <div className="sm:hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 animate-pulse">
                  <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Chargement...</h3>
                <p className="text-gray-400 text-sm">
                  Récupération des sorties en cours...
                </p>
              </div>
            ) : dayReleases.length > 0 ? (
              <div className={`border rounded-lg overflow-hidden ${
                isCurrentDay ? 'border-red-600/40 bg-red-600/5' : 'border-white/10 bg-black/40'
              }`}>
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-4 rounded-full ${
                        isCurrentDay ? 'bg-red-600' : 'bg-white/40'
                      }`}></div>
                      <div>
                        <h3 className="text-sm font-bold">
                          {currentDay.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                        </h3>
                        {isCurrentDay && (
                          <span className="text-red-400 text-xs font-medium">Aujourd'hui</span>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-green-600/20 text-green-400 border border-green-600/40 rounded-full text-xs">
                      {(() => {
                        // Calculer le nombre total d'épisodes en tenant compte des plages
                        const totalEpisodes = dayReleases.reduce((sum: number, release: any) => {
                          return sum + getEpisodeCount(release.episode_number, release.episode_range)
                        }, 0)
                        return totalEpisodes
                      })()}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    {dayReleases.map((release: any) => {
                      const episodeInfo = formatEpisodeInfo(release.season_number, release.episode_number, release.episode_range)
                      const firstEpisode = getFirstEpisodeFromRange(release.episode_range) || release.episode_number
                      
                      return (
                      <Link 
                        key={release.id}
                        href={`/watch/series/${release.tmdb_id}/${release.season_number}/${firstEpisode}`}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors duration-300">
                          {release.seriesDetails?.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${release.seriesDetails.poster_path}`}
                              alt={release.seriesDetails.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                                  <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                                  </svg>
                                </div>
                                <p className="text-white text-xs font-medium line-clamp-3">{release.seriesDetails?.name || release.series_name || 'Série'}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Episode info badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 bg-red-600 border border-red-600/40 rounded-full text-xs text-white font-medium">
                              {episodeInfo}
                            </span>
                          </div>
                          
                          {/* Time badge */}
                          {release.release_time && (
                            <div className="absolute top-1.5 right-1.5">
                              <span className="px-1.5 py-0.5 bg-black border border-white/20 rounded-full text-xs text-white">
                                {formatTime(release.release_time)}
                              </span>
                            </div>
                          )}
                          
                          {/* Rating badge */}
                          {release.seriesDetails?.vote_average && (
                            <div className="absolute bottom-1.5 right-1.5">
                              <span className="px-1.5 py-0.5 bg-black border border-white/20 rounded-full text-xs text-white font-medium">
                                <span className="text-yellow-400 mr-1">★</span>
                                {release.seriesDetails.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <h3 className="font-medium text-white text-xs line-clamp-1 group-hover:text-gray-200 transition-colors">
                            {release.seriesDetails?.name || release.series_name || 'Série'}
                          </h3>
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                            {release.episode_title || (release.episode_range ? `Épisodes ${release.episode_range}` : `Épisode ${release.episode_number}`)}
                          </p>
                        </div>
                      </Link>
                    )})}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune sortie ce jour</h3>
                <p className="text-gray-400 text-sm">
                  Aucun épisode ne sort aujourd'hui. Consultez les autres jours pour découvrir les prochaines sorties.
                </p>
              </div>
            )}
          </div>

          {/* Desktop: Show all days */}
          <div className="hidden sm:block space-y-8">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20 animate-pulse">
                  <svg className="w-10 h-10 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-4">Chargement...</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Récupération des sorties de séries en cours...
                </p>
              </div>
            ) : (
              currentWeekDates.map((date) => {
                const dateKey = date.toISOString().split('T')[0]
                const dayReleases = releasesByDate.get(dateKey) || []
                const isCurrentDay = isToday(date)
                
                if (dayReleases.length === 0) return null
                
                return (
                <div key={dateKey} className={`border rounded-lg overflow-hidden ${
                  isCurrentDay ? 'border-red-600/40 bg-red-600/5' : 'border-white/10 bg-black/40'
                }`}>
                  {/* Desktop Header */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-1 h-8 rounded-full ${
                        isCurrentDay ? 'bg-red-600' : 'bg-white/40'
                      }`}></div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold">
                          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        {isCurrentDay && (
                          <span className="text-red-400 text-sm font-medium">Aujourd'hui</span>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/40 rounded-full text-sm">
                        {(() => {
                          // Calculer le nombre total d'épisodes en tenant compte des plages
                          const totalEpisodes = dayReleases.reduce((sum: number, release: any) => {
                            return sum + getEpisodeCount(release.episode_number, release.episode_range)
                          }, 0)
                          return `${totalEpisodes} sortie${totalEpisodes > 1 ? 's' : ''}`
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Releases Grid */}
                  <div className="p-4 md:p-6 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      {dayReleases.map((release: any) => {
                        const episodeInfo = formatEpisodeInfo(release.season_number, release.episode_number, release.episode_range)
                        const firstEpisode = getFirstEpisodeFromRange(release.episode_range) || release.episode_number
                        
                        return (
                        <Link 
                          key={release.id}
                          href={`/watch/series/${release.tmdb_id}/${release.season_number}/${firstEpisode}`}
                          className="group cursor-pointer"
                        >
                          <div className="relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors duration-300">
                            {release.seriesDetails?.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w342${release.seriesDetails.poster_path}`}
                                alt={release.seriesDetails.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <div className="text-center p-4">
                                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                                    <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                                    </svg>
                                  </div>
                                  <p className="text-white text-xs font-medium line-clamp-3">{release.seriesDetails?.name || release.series_name || 'Série'}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Episode info badge */}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-red-600 border border-red-600/40 rounded-full text-xs text-white font-medium">
                                {episodeInfo}
                              </span>
                            </div>
                            
                            {/* Time badge */}
                            {release.release_time && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-black border border-white/20 rounded-full text-xs text-white">
                                  {formatTime(release.release_time)}
                                </span>
                              </div>
                            )}
                            
                            {/* Rating badge */}
                            {release.seriesDetails?.vote_average && (
                              <div className="absolute bottom-2 right-2">
                                <span className="px-2 py-1 bg-black border border-white/20 rounded-full text-xs text-white font-medium">
                                  <span className="text-yellow-400 mr-1">★</span>
                                  {release.seriesDetails.vote_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-gray-200 transition-colors">
                              {release.seriesDetails?.name || release.series_name || 'Série'}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">
                              {release.episode_title || (release.episode_range ? `Épisodes ${release.episode_range}` : `Épisode ${release.episode_number}`)}
                            </p>
                            {release.seriesDetails?.genres && (
                              <p className="text-gray-500 text-xs mt-1">
                                {release.seriesDetails.genres.slice(0, 2).map((g: any) => g.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </Link>
                      )})}
                    </div>
                  </div>
                </div>
              )
            })
            )}
          </div>
        </div>

        {/* No releases this week */}
        {!loading && currentWeekDates.every(date => (releasesByDate.get(date.toISOString().split('T')[0]) || []).length === 0) && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
              <svg className="w-10 h-10 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Aucune sortie cette semaine</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Aucun épisode ne sort cette semaine. Consultez les semaines suivantes pour découvrir les prochaines sorties.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
