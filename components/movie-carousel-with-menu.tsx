'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star, Eye, Download, Share2, Plus, Minus, Play, X } from 'lucide-react'
import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Movie {
  id: number
  title?: string
  name?: string
  poster_path: string
  backdrop_path?: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  media_type?: string
  rank?: number
  overview?: string
  genres?: Array<{ id: number; name: string }>
}

interface MovieCarouselProps {
  title: string | React.ReactNode
  movies: Movie[]
  showRank?: boolean
}

export default function MovieCarouselWithMenu({ title, movies, showRank = false }: MovieCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: true,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [bannedContent, setBannedContent] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ movie: Movie; x: number; y: number } | null>(null)
  const [watchlist, setWatchlist] = useState<Set<number>>(new Set())
  const [loadingWatchlist, setLoadingWatchlist] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { data: session } = useSession()

  // Vérifier le contenu banni au chargement du composant
  useEffect(() => {
    const checkBannedContent = async () => {
      const bannedSet = new Set<string>()

      // Vérifier chaque film/série pour voir s'il est banni
      for (const movie of movies) {
        try {
          const mediaType = getMediaType(movie)
          const response = await fetch(`/api/banned?tmdb_id=${movie.id}&content_type=${mediaType}`)
          const data = await response.json()

          if (data.banned) {
            bannedSet.add(`${movie.id}-${mediaType}`)
          }
        } catch (error) {
          console.error('Error checking banned content:', error)
        }
      }

      setBannedContent(bannedSet)
    }

    if (movies.length > 0) {
      checkBannedContent()
    }
  }, [movies])

  // Charger la watchlist
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!session?.user?.id) return
      setLoadingWatchlist(true)
      try {
        const response = await fetch('/api/watchlist')
        if (response.ok) {
          const data = await response.json()
          const watchlistIds = new Set<number>(data.list?.map((item: any) => Number(item.tmdb_id)) || [])
          setWatchlist(watchlistIds)
        }
      } catch (error) {
        console.error('Error loading watchlist:', error)
      } finally {
        setLoadingWatchlist(false)
      }
    }

    loadWatchlist()
  }, [session])

  // Écouter les changements de watchlist depuis d'autres composants
  useEffect(() => {
    const handleWatchlistChange = (event: CustomEvent) => {
      const { action, tmdbId, contentType } = event.detail
      
      if (action === 'added') {
        setWatchlist(prev => new Set(prev).add(tmdbId))
      } else if (action === 'removed') {
        setWatchlist(prev => {
          const newSet = new Set(prev)
          newSet.delete(tmdbId)
          return newSet
        })
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

  // Gérer la fermeture du menu contextuel
  useEffect(() => {
    if (!contextMenu) return

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setContextMenu(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleGlobalClick)
    document.addEventListener('touchstart', handleGlobalClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick)
      document.removeEventListener('touchstart', handleGlobalClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  const createSlug = (title: string, id: number) => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${id}-${slug}`
  }

  const getMediaType = (movie: Movie) => {
    if (movie.media_type) return movie.media_type
    return movie.title ? 'movie' : 'tv'
  }

  const getDetailLink = (movie: Movie) => {
    const mediaType = getMediaType(movie)
    const slug = createSlug(movie.title || movie.name || '', movie.id)
    return `/${mediaType === 'movie' ? 'movies' : 'series'}/${slug}`
  }

  const getWatchLink = (movie: Movie) => {
    const mediaType = getMediaType(movie)
    return `/watch/${movie.id}`
  }

  // Calculer la position du menu pour éviter de sortir de l'écran
  const menuStyle = useMemo<CSSProperties | undefined>(() => {
    if (!contextMenu) return undefined

    const menuWidth = 220
    const menuHeight = 240
    const padding = 12
    let x = contextMenu.x
    let y = contextMenu.y

    if (typeof window !== 'undefined') {
      const maxX = window.innerWidth - menuWidth - padding
      const maxY = window.innerHeight - menuHeight - padding

      if (x > maxX) {
        x = Math.max(padding, maxX)
      }

      if (y > maxY) {
        y = Math.max(padding, maxY)
      }
    }

    return { top: y, left: x }
  }, [contextMenu])

  const contextMenuStyle: CSSProperties | undefined = menuStyle ? { position: 'fixed', ...menuStyle } : undefined

  // Ouvrir le menu contextuel
  const openContextMenu = (movie: Movie, x: number, y: number) => {
    setContextMenu({ movie, x, y })
  }

  // Gérer la watchlist
  const toggleWatchlist = async (movie: Movie) => {
    if (!session?.user?.id) {
      alert('Connectez-vous pour gérer votre watchlist')
      return
    }

    const mediaType = getMediaType(movie)
    const isInWatchlist = watchlist.has(movie.id)

    try {
      if (isInWatchlist) {
        // Retirer de la watchlist
        const response = await fetch('/api/watchlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tmdb_id: movie.id,
            content_type: mediaType
          })
        })
        
        if (response.ok) {
          setWatchlist(prev => {
            const newSet = new Set(prev)
            newSet.delete(movie.id)
            return newSet
          })
          
          // Émettre un événement pour synchroniser les autres composants
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('watchlist-changed', {
              detail: { action: 'removed', tmdbId: movie.id, contentType: mediaType }
            }))
          }
        }
      } else {
        // Ajouter à la watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tmdb_id: movie.id,
            content_type: mediaType
          })
        })
        
        if (response.ok) {
          setWatchlist(prev => new Set(prev).add(movie.id))
          
          // Émettre un événement pour synchroniser les autres composants
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('watchlist-changed', {
              detail: { action: 'added', tmdbId: movie.id, contentType: mediaType }
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      alert('Erreur lors de la mise à jour de la watchlist')
    }

    setContextMenu(null)
  }

  // Enregistrer l'image
  const handleSaveImage = (movie: Movie) => {
    if (typeof document === 'undefined') return
    const imageUrl = movie.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${createSlug(movie.title || movie.name || '', movie.id)}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setContextMenu(null)
  }

  // Partager
  const handleShare = async (movie: Movie) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    const url = `${window.location.origin}${getDetailLink(movie)}`
    const payload = {
      title: movie.title || movie.name || 'Titre inconnu',
      text: `Découvre ${movie.title || movie.name} sur ZTVPlus`,
      url
    }

    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Lien copié dans le presse-papiers!')
      } else {
        window.prompt('Copie ce lien pour le partager', url)
      }
    } catch (error) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Lien copié dans le presse-papiers!')
      } else {
        window.prompt('Copie ce lien pour le partager', url)
      }
    }

    setContextMenu(null)
  }

  // Voir les détails
  const handleViewDetails = (movie: Movie) => {
    if (typeof window !== 'undefined') {
      window.location.href = getDetailLink(movie)
    }
    setContextMenu(null)
  }

  // Filtrer les films bannis
  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const mediaType = getMediaType(movie)
      return !bannedContent.has(`${movie.id}-${mediaType}`)
    })
  }, [movies, bannedContent])

  return (
    <div className="w-full py-8 pl-4 sm:pl-6 lg:pl-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-8 bg-blue-500"></div>
        <h2 className="text-2xl font-bold text-white">{typeof title === 'string' ? title : title}</h2>
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
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-[0_0_150px] xs:flex-[0_0_120px] sm:flex-[0_0_180px] md:flex-[0_0_200px] lg:flex-[0_0_220px] group cursor-pointer"
              onClick={(event) => {
                event.preventDefault()
                openContextMenu(movie, event.clientX, event.clientY)
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                openContextMenu(movie, event.clientX, event.clientY)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  const rect = event.currentTarget.getBoundingClientRect()
                  const x = rect.left + rect.width / 2
                  const y = rect.top + rect.height / 2
                  openContextMenu(movie, x, y)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Options pour ${movie.title || movie.name || 'Film'}`}
            >
              <div className="relative overflow-hidden rounded-lg border border-gray-300/30 bg-black/80 backdrop-blur-sm hover:border-gray-100/50 transition-colors">
                {/* Poster */}
                <div className="aspect-[2/3] relative bg-gray-200 overflow-hidden">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title || movie.name || 'Film'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 120px, (max-width: 1024px) 180px, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs text-center px-2">No image</span>
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  {showRank && movie.rank && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="text-6xl md:text-7xl font-black" style={{
                        color: 'black',
                        WebkitTextStroke: '0.5px white'
                      }}>
                        {movie.rank}
                      </div>
                    </div>
                  )}
                  
                  {/* Watchlist Badge */}
                  {!loadingWatchlist && watchlist.has(movie.id) && (
                    <div className="absolute top-2 left-2 z-10">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-600 text-white shadow-lg">
                        <Plus className="w-3 h-3 mr-1" />
                        Watchlist
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center p-2">
                      <p className="text-xs font-semibold line-clamp-2 mb-1">
                        {movie.title || movie.name || 'N/A'}
                      </p>
                      <div className="flex items-center justify-center text-yellow-400 text-xs">
                        <span className="mr-1">★</span>
                        <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-2 px-2 pb-2">
                  <p className="text-xs font-medium text-white line-clamp-1">
                    {movie.title || movie.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(movie.release_date || movie.first_air_date)?.split('-')[0] || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          style={contextMenuStyle}
          className="z-50 w-56 space-y-1 rounded-2xl border border-white/20 bg-neutral-900/90 p-3 text-sm shadow-2xl backdrop-blur"
        >
          <button
            type="button"
            onClick={() => handleViewDetails(contextMenu.movie)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 w-full text-left"
          >
            <Eye className="h-4 w-4" />
            Voir les détails
          </button>
          <button
            type="button"
            onClick={() => handleSaveImage(contextMenu.movie)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 w-full text-left"
          >
            <Download className="h-4 w-4" />
            Enregistrer l'image
          </button>
          <button
            type="button"
            onClick={() => toggleWatchlist(contextMenu.movie)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 w-full text-left"
          >
            {watchlist.has(contextMenu.movie.id) ? (
              <>
                <Minus className="h-4 w-4" />
                Retirer de la watchlist
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Ajouter à la watchlist
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleShare(contextMenu.movie)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 w-full text-left"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
          <div className="border-t border-white/20 my-1"></div>
          <button
            type="button"
            onClick={() => setContextMenu(null)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-400 transition hover:bg-white/10 w-full text-left"
          >
            <X className="h-4 w-4" />
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
