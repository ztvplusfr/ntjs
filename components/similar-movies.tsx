'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'
import Image from 'next/image'

interface SimilarMovie {
  id: number
  title: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  vote_average?: number
}

interface SimilarMoviesProps {
  movies: SimilarMovie[]
}

export default function SimilarMovies({ movies }: SimilarMoviesProps) {
  if (!movies || movies.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-red-600 rounded-full"></div>
        <h2 className="text-3xl font-bold">Recommandations</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <Link 
            key={movie.id}
            href={`/movies/${movie.id}-${movie.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
            className="group cursor-pointer w-full"
          >
            <div className="relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors duration-300 w-full">
              {movie.poster_path ? (
                <>
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white/20">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center p-4">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                    <p className="text-white text-xs font-medium line-clamp-3">{movie.title}</p>
                  </div>
                </div>
              )}
              
              {/* Rating badge */}
              {movie.vote_average && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-black border border-white/20 rounded-full text-xs text-white font-medium">
                    <span className="text-yellow-400 mr-1">★</span>
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              
              {/* Year badge */}
              {movie.release_date && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-black border border-white/20 rounded-full text-xs text-white">
                    {movie.release_date.split('-')[0]}
                  </span>
                </div>
              )}
            </div>
            
            {/* Title */}
            <div className="mt-3">
              <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-gray-200 transition-colors">
                {movie.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
