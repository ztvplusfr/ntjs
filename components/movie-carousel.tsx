'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Movie {
  id: number
  title?: string
  name?: string
  poster_path: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  media_type?: string
  rank?: number
}

interface MovieCarouselProps {
  title: string | React.ReactNode
  movies: Movie[]
  showRank?: boolean
}

export default function MovieCarousel({ title, movies, showRank = false }: MovieCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: true,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [bannedContent, setBannedContent] = useState<Set<string>>(new Set())

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
            <Link
              key={movie.id}
              href={`/${getMediaType(movie) === 'movie' ? 'movies' : 'series'}/${createSlug(movie.title || movie.name || '', movie.id)}`}
              className="flex-[0_0_150px] xs:flex-[0_0_120px] sm:flex-[0_0_180px] md:flex-[0_0_200px] lg:flex-[0_0_220px] group cursor-pointer"
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
