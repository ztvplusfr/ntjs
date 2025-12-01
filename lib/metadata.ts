import { Metadata } from 'next'

interface SeriesMetadataProps {
  id: string
}

export async function generateSeriesMetadata({ id }: SeriesMetadataProps): Promise<Metadata> {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&append_to_response=keywords`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    })
    
    if (!response.ok) {
      return {
        title: 'ZTVPlus - Streaming',
        description: 'Plateforme de streaming gratuit',
      }
    }
    
    const serie = await response.json()
    const title = `${serie.name} (${serie.first_air_date?.split('-')[0]}) - ZTVPlus`
    const description = serie.overview || `Regardez ${serie.name} en streaming HD gratuit. ${serie.number_of_seasons ? `${serie.number_of_seasons} saison${serie.number_of_seasons > 1 ? 's' : ''}.` : ''} ${serie.genres?.map((g: { id: number; name: string }) => g.name).slice(0, 3).join(', ') || ''}`
    const image = serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : '/og-default.jpg'
    
    return {
      title,
      description,
      keywords: [
        serie.name,
        'streaming',
        'gratuit',
        'série',
        'VF',
        'VOSTFR',
        ...(serie.genres?.map((g: { id: number; name: string }) => g.name.toLowerCase()) || []),
        serie.first_air_date?.split('-')[0]
      ].filter(Boolean).join(', '),
      openGraph: {
        title,
        description,
        type: 'video.tv_show',
        siteName: 'ZTVPlus - Streaming Platform',
        locale: 'fr_FR',
        images: [
          {
            url: image,
            width: 500,
            height: 750,
            alt: `${serie.name} - Poster officiel`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch (error) {
    return {
      title: 'ZTVPlus - Streaming',
      description: 'Plateforme de streaming gratuit',
    }
  }
}

interface MovieMetadataProps {
  id: string
}

export async function generateMovieMetadata({ id }: MovieMetadataProps): Promise<Metadata> {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&append_to_response=keywords`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    })
    
    if (!response.ok) {
      return {
        title: 'ZTVPlus - Streaming',
        description: 'Plateforme de streaming gratuit',
      }
    }
    
    const movie = await response.json()
    const title = `${movie.title} (${movie.release_date?.split('-')[0]}) - ZTVPlus`
    const description = movie.overview || `Regardez ${movie.title} en streaming HD gratuit. ${movie.runtime ? `Durée : ${movie.runtime} minutes.` : ''} ${movie.genres?.map((g: { id: number; name: string }) => g.name).slice(0, 3).join(', ') || ''}`
    const image = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/og-default.jpg'
    
    return {
      title,
      description,
      keywords: [
        movie.title,
        'streaming',
        'gratuit',
        'film',
        'VF',
        'VOSTFR',
        ...(movie.genres?.map((g: { id: number; name: string }) => g.name.toLowerCase()) || []),
        movie.release_date?.split('-')[0]
      ].filter(Boolean).join(', '),
      openGraph: {
        title,
        description,
        type: 'video.movie',
        siteName: 'ZTVPlus - Streaming Platform',
        locale: 'fr_FR',
        images: [
          {
            url: image,
            width: 500,
            height: 750,
            alt: `${movie.title} - Poster officiel`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch (error) {
    return {
      title: 'ZTVPlus - Streaming',
      description: 'Plateforme de streaming gratuit',
    }
  }
}

interface EpisodeMetadataProps {
  seriesId: string
  season: string
  episode: string
}

export async function generateEpisodeMetadata({ seriesId, season, episode }: EpisodeMetadataProps): Promise<Metadata> {
  try {
    // Fetch series data
    const seriesResponse = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    })
    
    // Fetch episode data
    const episodeResponse = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}/season/${season}/episode/${episode}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    })
    
    if (!seriesResponse.ok || !episodeResponse.ok) {
      return {
        title: 'ZTVPlus - Streaming',
        description: 'Plateforme de streaming gratuit',
      }
    }
    
    const [serie, episodeDetails] = await Promise.all([seriesResponse.json(), episodeResponse.json()])
    const title = `${serie.name} S${season}E${episode} - ${episodeDetails?.name || `Épisode ${episode}`} - ZTVPlus`
    const description = episodeDetails?.overview || `Regarder ${serie.name} Saison ${season} Épisode ${episode} en streaming HD gratuit sur ZTVPlus. ${serie.number_of_seasons ? `${serie.number_of_seasons} saison${serie.number_of_seasons > 1 ? 's' : ''}.` : ''} ${serie.genres?.map((g: { id: number; name: string }) => g.name).slice(0, 3).join(', ') || ''}`
    
    const posterUrl = serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : '/og-default.jpg'
    const backdropUrl = serie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${serie.backdrop_path}` : posterUrl
    const episodeStillUrl = episodeDetails?.still_path
      ? `https://image.tmdb.org/t/p/w1280${episodeDetails.still_path}`
      : backdropUrl
    
    return {
      title,
      description,
      keywords: [
        serie.name,
        'streaming',
        'gratuit',
        'série',
        'VF',
        'VOSTFR',
        `saison ${season}`,
        `épisode ${episode}`,
        episodeDetails?.name || '',
        ...(serie.genres?.map((g: { id: number; name: string }) => g.name.toLowerCase()) || []),
        serie.first_air_date?.split('-')[0]
      ].filter(Boolean).join(', '),
      openGraph: {
        title,
        description,
        type: 'video.episode',
        siteName: 'ZTVPlus - Streaming Platform',
        locale: 'fr_FR',
        images: [
          {
            url: episodeStillUrl || posterUrl,
            width: 1280,
            height: 720,
            alt: `${serie.name} S${season}E${episode} - ${episodeDetails?.name || `Épisode ${episode}`}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [episodeStillUrl || posterUrl],
      },
    }
  } catch (error) {
    return {
      title: 'ZTVPlus - Streaming',
      description: 'Plateforme de streaming gratuit',
    }
  }
}
