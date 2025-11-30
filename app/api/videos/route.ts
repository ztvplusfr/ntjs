import { NextRequest, NextResponse } from 'next/server'
import { supabase, getMovieVideos } from '@/lib/supabase'

interface Video {
  id: string
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
  hasAds: boolean
  server: string
}

interface VideoResponse {
  videos: Video[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('id')

  if (!movieId) {
    return NextResponse.json(
      { error: 'Movie ID is required' },
      { status: 400 }
    )
  }

  const tmdbId = parseInt(movieId)
  if (isNaN(tmdbId)) {
    return NextResponse.json(
      { error: 'Invalid movie ID' },
      { status: 400 }
    )
  }

  try {
    // Récupérer les vidéos depuis Supabase
    const videos = await getMovieVideos(tmdbId)
    
    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found for this movie' },
        { status: 404 }
      )
    }

    // Transformer les données pour ajouter les propriétés manquantes
    const transformedVideos = videos.map((video) => ({
      id: video.id.toString(), // Ajout de l'ID de la vidéo
      name: video.name || `Server ${video.id}`,
      url: video.url,
      lang: video.lang,
      quality: video.quality,
      pub: video.pub,
      play: video.play,
      hasAds: video.pub === 1,
      server: video.name || `Server ${video.id}`
    }))

    return NextResponse.json({ videos: transformedVideos })
  } catch (error) {
    console.error('Error in videos API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
