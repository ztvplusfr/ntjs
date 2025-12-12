'use client'

import { useState, useEffect, useRef } from 'react'
import { Info, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import WatchlistButton, { ButtonState } from '@/components/watchlist-button'
import { TypographyH1 } from '@/components/ui/typography'

interface TMDBContent {
  id: number
  title?: string
  name?: string
  overview: string
  backdrop_path: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  runtime?: number
  media_type?: string
  logo_path?: string
  has_logo?: boolean
  genres?: string[]
}

const getFrenchMediaType = (mediaType?: string) => {
  const normalized = (mediaType || "").toLowerCase()
  if (normalized.includes("tv") || normalized.includes("série") || normalized.includes("serie")) {
    return "Série"
  }
  if (normalized.includes("movie") || normalized.includes("film")) {
    return "Film"
  }
  return "Contenu"
}

export default function Hero() {
  const [featuredContent, setFeaturedContent] = useState<TMDBContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [watchlistStates, setWatchlistStates] = useState<Record<number, ButtonState>>({})
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [lastAction, setLastAction] = useState<'added' | 'removed' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fonction pour passer au contenu suivant
  const nextContent = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredContent.length - 1 ? 0 : prevIndex + 1
    )
  }

  // Fonction pour revenir au contenu précédent
  const prevContent = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredContent.length - 1 : prevIndex - 1
    )
  }

  // Handlers pour le swipe tactile
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextContent()
    }
    if (isRightSwipe) {
      prevContent()
    }
  }

  // Effet pour le défilement automatique
  useEffect(() => {
    if (featuredContent.length > 1) {
      const timer = setTimeout(nextContent, 10000) // Change toutes les 10 secondes
      return () => clearTimeout(timer)
    }
  }, [currentIndex, featuredContent.length])

  const handleWatchlistStateChange = (nextState: ButtonState, id: number) => {
    const prevState = watchlistStates[id]
    setWatchlistStates((prev) => ({
      ...prev,
      [id]: nextState
    }))

    if (nextState === 'saved') {
      setLastAction('added')
    } else if (nextState === 'idle' && prevState === 'saved') {
      setLastAction('removed')
    }
  }

  useEffect(() => {
    if (!featuredContent || featuredContent.length === 0) return

    const controller = new AbortController()

    const fetchWatchlist = async () => {
      try {
        const response = await fetch('/api/watchlist', {
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const saved = new Set<number>((data?.list || []).map((item: any) => Number(item.tmdb_id)))

        if (saved.size === 0) return

        setWatchlistStates((prev) => {
          const clone = { ...prev }
          featuredContent.forEach((content) => {
            if (saved.has(content.id)) {
              clone[content.id] = 'saved'
            }
          })
          return clone
        })
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.error('Unable to load hero watchlist state:', error)
      }
    }

    fetchWatchlist()

    return () => controller.abort()
  }, [featuredContent])

  // Écouter les changements de watchlist depuis d'autres composants
  useEffect(() => {
    const handleWatchlistChange = (event: CustomEvent) => {
      const { action, tmdbId } = event.detail
      
      if (action === 'added') {
        setWatchlistStates(prev => ({
          ...prev,
          [tmdbId]: 'saved'
        }))
        setLastAction('added')
      } else if (action === 'removed') {
        setWatchlistStates(prev => ({
          ...prev,
          [tmdbId]: 'idle'
        }))
        setLastAction('removed')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('watchlist-changed', handleWatchlistChange as EventListener)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('watchlist-changed', handleWatchlistChange as EventListener)
      }
    }
  }, [])

  useEffect(() => {
    if (!lastAction) return
    const timer = setTimeout(() => {
      setLastAction(null)
    }, 2800)

    return () => clearTimeout(timer)
  }, [lastAction])

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
        
        // Récupérer les films et séries tendances du jour
        const [moviesResponse, seriesResponse] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&language=fr-FR`),
          fetch(`https://api.themoviedb.org/3/trending/tv/day?api_key=${apiKey}&language=fr-FR`)
        ])
        
        if (!moviesResponse.ok || !seriesResponse.ok) {
          throw new Error('Failed to fetch content')
        }
        
        const [moviesData, seriesData] = await Promise.all([
          moviesResponse.json(),
          seriesResponse.json()
        ])
        
        // Prendre les 3 premiers films et 3 premières séries tendances
        const selectedMovies = moviesData.results.slice(0, 3).map((movie: any) => ({
          ...movie,
          media_type: 'movie'
        }))
        
        const selectedSeries = seriesData.results.slice(0, 3).map((serie: any) => ({
          ...serie,
          media_type: 'tv',
          title: serie.name,
          release_date: serie.first_air_date
        }))
        
        // Mélanger les films et séries
        const allContent = [...selectedMovies, ...selectedSeries].sort(() => 0.5 - Math.random())
        
        // Récupérer les logos pour chaque contenu
        const contentWithLogos = await Promise.all(
          allContent.map(async (content: TMDBContent) => {
            try {
              const mediaType =
                (content.media_type || '').toLowerCase().includes('tv') ? 'tv' : 'movie'

                const detailsResponse = await fetch(
                  `https://api.themoviedb.org/3/${mediaType}/${content.id}?api_key=${apiKey}&language=fr-FR&append_to_response=images&include_image_language=fr,null`
                )

              if (detailsResponse.ok) {
                const details = await detailsResponse.json()
                const logos = details.images?.logos || []
                const findByLang = (lang: string) =>
                  logos.find((logo: any) => (logo.iso_639_1 || "").toLowerCase() === lang)
                const frenchLogo = findByLang("fr")
                const englishLogo = findByLang("en")
                const selectedLogo = frenchLogo || englishLogo || logos[0]

                return {
                  ...content,
                  ...details,
                  name: details.name || content.name,
                  title: details.title || content.title,
                  logo_path: selectedLogo?.file_path,
                  has_logo: !!selectedLogo,
                  genres: Array.isArray(details.genres)
                    ? details.genres.map((genre: any) => genre.name).filter(Boolean)
                    : [],
                }
              }
            } catch (error) {
              console.error('Error fetching detail for content:', content.id, error)
            }

            return {
              ...content,
              logo_path: undefined,
              has_logo: false,
              genres: [],
            }
          })
        )
        
        setFeaturedContent(contentWithLogos)
      } catch (error) {
        console.error('Error fetching featured content:', error)
        // Fallback avec des données statiques
        setFeaturedContent([
          {
            id: 1,
            title: "Film Populaire 1",
            overview: "Découvrez ce contenu captivant qui va vous tenir en haleine du début à la fin.",
            backdrop_path: "/backdrop1.jpg",
            release_date: "2024-01-01",
            vote_average: 8.5,
            runtime: 120,
            media_type: "movie",
            logo_path: undefined,
            has_logo: false,
            genres: ["Film"]
          },
          {
            id: 2,
            title: "Série Populaire 1",
            overview: "Une série passionnante avec des rebondissements inattendus.",
            backdrop_path: "/backdrop2.jpg",
            release_date: "2024-02-15",
            vote_average: 8.0,
            runtime: 45,
            media_type: "tv",
            logo_path: undefined,
            has_logo: false,
            genres: ["Série"]
          },
          {
            id: 3,
            title: "Film Populaire 2",
            overview: "Une autre aventure épique à découvrir.",
            backdrop_path: "/backdrop3.jpg",
            release_date: "2024-03-15",
            vote_average: 8.3,
            runtime: 110,
            media_type: "movie",
            logo_path: undefined,
            has_logo: false,
            genres: ["Film"]
          },
          {
            id: 4,
            title: "Série Populaire 2",
            overview: "Une suite palpitante pleine de mystère.",
            backdrop_path: "/backdrop4.jpg",
            release_date: "2024-04-01",
            vote_average: 7.9,
            runtime: 50,
            media_type: "tv",
            logo_path: undefined,
            has_logo: false,
            genres: ["Série"]
          },
          {
            id: 5,
            title: "Film Populaire 3",
            overview: "Du spectacle grand écran comme on l'aime.",
            backdrop_path: "/backdrop5.jpg",
            release_date: "2024-05-12",
            vote_average: 8.1,
            runtime: 130,
            media_type: "movie",
            logo_path: undefined,
            has_logo: false,
            genres: ["Film"]
          },
          {
            id: 6,
            title: "Série Populaire 3",
            overview: "Une troisième saison qui élève encore la barre.",
            backdrop_path: "/backdrop6.jpg",
            release_date: "2024-06-30",
            vote_average: 8.2,
            runtime: 48,
            media_type: "tv",
            logo_path: undefined,
            has_logo: false,
            genres: ["Série"]
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedContent()
  }, [])

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    )
  }

  if (!featuredContent || featuredContent.length === 0) return null

  const currentContent = featuredContent[currentIndex]
  const backdropUrl = currentContent.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${currentContent.backdrop_path}`
    : '/placeholder-hero.jpg'

  const title = currentContent.title || currentContent.name || 'Contenu'
  const normalizedType = String(currentContent.media_type || '').toLowerCase()
  const isSeriesContent =
    normalizedType.includes('tv') ||
    normalizedType.includes('série') ||
    normalizedType.includes('serie')
  const watchlistContentType = isSeriesContent ? 'series' : 'movie'
  const mediaTypeLabel = getFrenchMediaType(currentContent.media_type)
  const genreLabel = currentContent.genres && currentContent.genres.length > 0
    ? currentContent.genres[0]
    : 'Genre varié'
  const ratingValue = currentContent.vote_average ? currentContent.vote_average.toFixed(1) : null

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {lastAction && (
        <div
          aria-live="assertive"
          className="pointer-events-none absolute top-6 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] shadow-xl"
        >
          <span
            className={`h-3 w-3 rounded-full shadow ${
              lastAction === 'added' ? 'bg-emerald-400 shadow-emerald-400/60' : 'bg-rose-500 shadow-rose-500/60'
            }`}
          />
          <span
            className={lastAction === 'added' ? 'text-emerald-300' : 'text-rose-300'}
          >
            {lastAction === 'added' ? 'Ajouté à la watchlist' : 'Retiré de la watchlist'}
          </span>
        </div>
      )}
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10 transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${backdropUrl})`,
          opacity: 1
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>
      
      {/* Navigation Buttons */}
      {featuredContent.length > 1 && (
        <>
          <button 
            onClick={prevContent}
            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={nextContent}
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/80 border border-gray-300/30 hover:bg-black/60 transition-colors backdrop-blur-sm"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          
          {/* Pagination Dots */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {featuredContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-8 border border-gray-300/30' 
                    : 'w-3 bg-white/30 hover:bg-white/50 border border-gray-300/30'
                }`}
                aria-label={`Aller au contenu ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex items-end md:items-center pl-8 pr-4 sm:pl-20 sm:pr-6 lg:pl-28 lg:pr-8 pt-16 md:pt-16 pb-8">
        <div className="max-w-2xl w-full">
          {/* Logo + Titre */}
          {currentContent.has_logo && currentContent.logo_path ? (
            <div className="mb-6">
              <Image
                src={`https://image.tmdb.org/t/p/original${currentContent.logo_path}`}
                alt={currentContent.title || currentContent.name || 'Contenu'}
                width={200}
                height={60}
                className="object-contain w-full max-w-[200px] h-auto"
                priority
              />
            </div>
          ) : (
            <TypographyH1 className="text-left text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              {title}
            </TypographyH1>
          )}
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-200 mb-8">
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
              {mediaTypeLabel}
            </span>
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
              {genreLabel}
            </span>
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
              Sélection du jour
            </span>
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              {ratingValue ? `Note ${ratingValue}` : 'Note inconnue'}
            </span>
          </div>
          
          <p className="text-sm sm:text-base text-gray-200 mb-6 line-clamp-3 md:line-clamp-4">
            {currentContent.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href={isSeriesContent
              ? `/series/${currentContent.id}-${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
              : `/movies/${currentContent.id}-${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
            }>
              <div className="px-6 py-3 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors flex items-center text-base sm:text-lg">
                <Info className="w-6 h-6 mr-2 text-white" />
                <span className="text-white font-medium">Plus d'infos</span>
              </div>
            </Link>
            <WatchlistButton
              tmdbId={currentContent.id}
              contentType={watchlistContentType}
              className="px-6 py-3 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm"
              defaultState={watchlistStates[currentContent.id] ?? 'idle'}
              onStateChange={(nextState) =>
                handleWatchlistStateChange(nextState, currentContent.id)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
