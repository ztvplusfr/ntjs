'use client'

import { useState, useEffect, useRef } from 'react'
import { Info, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import WatchlistButton, { ButtonState } from '@/components/watchlist-button'

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
        
        // Récupérer les films et séries populaires
        const [moviesResponse, seriesResponse] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=1`)
        ])
        
        if (!moviesResponse.ok || !seriesResponse.ok) {
          throw new Error('Failed to fetch content')
        }
        
        const [moviesData, seriesData] = await Promise.all([
          moviesResponse.json(),
          seriesResponse.json()
        ])
        
        // Prendre les 3 premiers films et 2 premières séries (ou inversement)
        const selectedMovies = moviesData.results.slice(0, 3).map((movie: any) => ({
          ...movie,
          media_type: 'Film'
        }))
        
        const selectedSeries = seriesData.results.slice(0, 2).map((serie: any) => ({
          ...serie,
          media_type: 'Série',
          title: serie.name,
          release_date: serie.first_air_date
        }))
        
        // Mélanger les films et séries
        const allContent = [...selectedMovies, ...selectedSeries]
          .sort(() => 0.5 - Math.random()) // Mélanger aléatoirement
          .slice(0, 5) // Prendre 5 éléments maximum
        
        // Récupérer les logos pour chaque contenu
        const contentWithLogos = await Promise.all(
          allContent.map(async (content: TMDBContent) => {
            try {
              const mediaType = content.media_type === 'Série' ? 'tv' : 'movie'
              const imagesResponse = await fetch(
                `https://api.themoviedb.org/3/${mediaType}/${content.id}/images?api_key=${apiKey}`
              )
              
              if (imagesResponse.ok) {
                const imagesData = await imagesResponse.json()
                
                // Chercher d'abord les logos en français, puis en anglais, puis autre langue
                const logos = imagesData.logos || []
                const frenchLogo = logos.find((logo: any) => logo.iso_639_1 === 'fr')
                const englishLogo = logos.find((logo: any) => logo.iso_639_1 === 'en')
                const anyLogo = logos[0] // Prendre le premier logo disponible
                
                const selectedLogo = frenchLogo || englishLogo || anyLogo
                
                return {
                  ...content,
                  logo_path: selectedLogo?.file_path,
                  has_logo: !!selectedLogo
                }
              }
            } catch (error) {
              console.error('Error fetching logo for content:', content.id, error)
            }
            
            return {
              ...content,
              logo_path: undefined,
              has_logo: false
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
            media_type: "Film",
            logo_path: undefined,
            has_logo: false
          },
          {
            id: 2,
            title: "Série Populaire 1",
            overview: "Une série passionnante avec des rebondissements inattendus.",
            backdrop_path: "/backdrop2.jpg",
            release_date: "2024-02-15",
            vote_average: 8.0,
            runtime: 45,
            media_type: "Série",
            logo_path: undefined,
            has_logo: false
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
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-gray-900 animate-pulse">
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
  const year = currentContent.release_date?.split('-')[0] || currentContent.first_air_date?.split('-')[0] || '2024'
  const normalizedType = String(currentContent.media_type || '').toLowerCase()
  const watchlistContentType = normalizedType.includes('série') || normalizedType.includes('serie') ? 'series' : 'movie'

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden -mt-16"
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
          {/* Logo ou Titre */}
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
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {title}
            </h1>
          )}
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-200 mb-8">
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
              {currentContent.media_type || 'Film'}
            </span>
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
              {year}
            </span>
            {currentContent.runtime && (
              <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm">
                {Math.floor(currentContent.runtime / 60)}h {currentContent.runtime % 60}min
              </span>
            )}
            <span className="px-3 py-1 bg-black/80 border border-gray-300/30 rounded-full backdrop-blur-sm flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              {currentContent.vote_average?.toFixed(1) || 'N/A'}
            </span>
          </div>
          
          <p className="text-sm sm:text-base text-gray-200 mb-6 line-clamp-3 md:line-clamp-4">
            {currentContent.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href={currentContent.media_type === 'Série' || currentContent.media_type === 'Serie' 
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
