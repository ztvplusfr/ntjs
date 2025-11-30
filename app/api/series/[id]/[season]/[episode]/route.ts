import { NextRequest, NextResponse } from 'next/server'
import { supabase, getEpisodeVideos } from '@/lib/supabase'

interface VideoServer {
  id: string
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
  hasAds?: boolean
  server?: string
}

interface EpisodeVideosResponse {
  videos: VideoServer[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; season: string; episode: string }> }
) {
  try {
    const { id, season, episode } = await params
    const tmdbId = parseInt(id)
    const seasonNumber = parseInt(season)
    const episodeNumber = parseInt(episode)

    if (isNaN(tmdbId) || isNaN(seasonNumber) || isNaN(episodeNumber)) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    // Récupérer les vidéos de l'épisode spécifique depuis Supabase
    const videos = await getEpisodeVideos(tmdbId, seasonNumber, episodeNumber)

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: 'Vidéos non disponibles pour cet épisode' },
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

    console.log(`Videos data for episode S${seasonNumber}E${episodeNumber} of series ${id}:`, JSON.stringify({ videos: transformedVideos }, null, 2))

    return NextResponse.json({ videos: transformedVideos }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error fetching episode videos:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des vidéos' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}