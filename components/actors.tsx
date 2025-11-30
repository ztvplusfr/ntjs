'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Actor {
  id: number
  name: string
  character: string
  profile_path?: string
}

interface ActorsProps {
  actors: Actor[]
}

export default function Actors({ actors }: ActorsProps) {
  if (!actors || actors.length === 0) {
    return null
  }

  // Limit to top 8 actors for better performance
  const displayActors = actors.slice(0, 8)

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-red-600 rounded-full"></div>
        <h2 className="text-3xl font-bold">Acteurs principaux</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {displayActors.map((actor) => (
          <Link 
            key={actor.id}
            href={`https://www.themoviedb.org/person/${actor.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer"
          >
            <div className="text-center">
              {/* Actor Image */}
              <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-lg bg-gray-900 border border-white/20 group-hover:border-white/40 transition-colors duration-300">
                {actor.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${actor.profile_path}`}
                    alt={actor.name}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                        <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actor Info */}
              <h3 className="font-medium text-white text-sm mb-1 line-clamp-1 group-hover:text-gray-200 transition-colors">
                {actor.name}
              </h3>
              <p className="text-gray-400 text-xs line-clamp-1">
                {actor.character}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Show more link if there are more actors */}
      {actors.length > 8 && (
        <div className="text-center mt-8">
          <a
            href={`https://www.themoviedb.org/movie/${actors[0].id}/cast`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-black border border-white/20 text-white rounded-lg hover:bg-white/10 hover:border-white/30 transition-colors duration-200"
          >
            Voir tout le casting
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
