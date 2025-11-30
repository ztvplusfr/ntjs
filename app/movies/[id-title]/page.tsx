import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import MovieClientPage from './client-page'

interface MoviePageProps {
  params: Promise<{
    'id-title': string
  }>
}

interface Video {
  id?: string
  name: string
  hasAds: boolean
  lang: string
  pub: number
  quality: string
  server: string
  url: string
  serverIndex?: number
}

interface VideoResponse {
  videos: Video[]
}

async function getStreamingVideos(id: string) {
  try {
    // Utiliser l'API interne comme pour les séries
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/movies/${id}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      console.log('API response not ok:', response.status)
      return null
    }
    
    const data = await response.json()
    console.log('API data received:', data)
    
    return data
  } catch (error) {
    console.error('Error fetching streaming videos:', error)
    return null
  }
}

async function getMovieImages(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/images?api_key=${apiKey}`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching movie images:', error)
    return null
  }
}

async function getMovieCast(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching movie cast:', error)
    return null
  }
}

async function getSimilarMovies(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    // Use recommendations instead of similar movies for better relevance
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${apiKey}&language=fr-FR&page=1`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    // If no recommendations, fallback to similar movies
    if (!data.results || data.results.length === 0) {
      const similarResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/similar?api_key=${apiKey}&language=fr-FR&page=1`
      )
      if (similarResponse.ok) {
        const similarData = await similarResponse.json()
        return similarData
      }
    }
    
    return data
  } catch (error) {
    console.error('Error fetching movie recommendations:', error)
    return null
  }
}

async function getMovieDetails(id: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=fr-FR`
    )
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const [id] = (await params)['id-title'].split('-')
  
  const movie = await getMovieDetails(id)
  
  if (!movie) {
    return {
      title: 'Film non trouvé',
    }
  }

  return {
    title: `${movie.title} (${movie.release_date?.split('-')[0]}) | ZTVPlus`,
    description: movie.overview || `Regardez ${movie.title} en streaming HD gratuit sur ZTVPlus. ${movie.runtime ? `Durée : ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min.` : ''} ${movie.genres?.map((g: any) => g.name).slice(0, 3).join(', ') || ''}`,
    keywords: [
      movie.title,
      'streaming',
      'gratuit',
      'film',
      'VF',
      'VOSTFR',
      ...(movie.genres?.map((g: any) => g.name.toLowerCase()) || []),
      movie.release_date?.split('-')[0]
    ].filter(Boolean).join(', '),
    openGraph: {
      title: `${movie.title} - Streaming HD Gratuit`,
      description: movie.overview || `Regardez ${movie.title} en streaming HD gratuit sur notre plateforme`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/movies/${(await params)['id-title']}`,
      siteName: 'Streaming Platform',
      images: [
        {
          url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/og-default.jpg',
          width: 500,
          height: 750,
          alt: `${movie.title} - Poster officiel`
        },
        ...(movie.backdrop_path ? [{
          url: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`,
          width: 1280,
          height: 720,
          alt: `${movie.title} - Image de fond`
        }] : [])
      ],
      locale: 'fr_FR',
      type: 'video.movie',
      tags: movie.genres?.map((g: any) => g.name) || [],
      releaseDate: movie.release_date,
      duration: movie.runtime ? movie.runtime * 60 : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.title} - Streaming HD Gratuit`,
      description: movie.overview || `Regardez ${movie.title} en streaming HD gratuit`,
      images: movie.poster_path ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`] : ['/og-default.jpg'],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/movies/${(await params)['id-title']}`
    }
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const [id] = (await params)['id-title'].split('-')
  
  console.log('MoviePage - Récupération des données pour le film ID:', id)
  
  const [movie, videos, imagesData, similarMovies, castData] = await Promise.all([
    getMovieDetails(id),
    getStreamingVideos(id),
    getMovieImages(id),
    getSimilarMovies(id),
    getMovieCast(id)
  ])

  console.log('MoviePage - Données récupérées :', {
    movie: movie ? movie.title : 'non trouvé',
    videos: videos ? `${videos.videos?.length || 0} vidéos de streaming` : 'null',
    imagesData: imagesData ? `${imagesData.posters?.length || 0} posters, ${imagesData.backdrops?.length || 0} backdrops` : 'absent',
    similarMovies: similarMovies ? `${similarMovies.results?.length || 0} films similaires` : 'null',
    cast: castData ? `${castData.cast?.length || 0} acteurs` : 'null'
  })

  if (!movie) {
    notFound()
  }

  return <MovieClientPage movie={movie} videos={videos} imagesData={imagesData} similarMovies={similarMovies} castData={castData} />
}
