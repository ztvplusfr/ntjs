import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSeriesVideos } from '@/lib/supabase'

interface VideoServer {
  id: string
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
}

interface EpisodeVideos {
  videos: VideoServer[]
}

interface SeasonEpisodes {
  [episodeNumber: string]: EpisodeVideos
}

interface SeasonData {
  episodes: SeasonEpisodes
}

interface SeriesVideosData {
  season: {
    [seasonNumber: string]: SeasonData
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tmdbId = parseInt(id)

    if (isNaN(tmdbId)) {
      return NextResponse.json(
        { error: 'ID de série invalide' },
        { status: 400 }
      )
    }

    // Récupérer toutes les vidéos de la série depuis Supabase
    const videos = await getSeriesVideos(tmdbId)

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: 'Vidéos non disponibles pour cette série' },
        { status: 404 }
      )
    }

    // Organiser les vidéos par saison et épisode
    const seriesData: SeriesVideosData = {
      season: {}
    }

    videos.forEach(video => {
      const seasonNum = video.season_number?.toString() || '1'
      const episodeNum = video.episode_number?.toString() || '1'

      // Initialiser la saison si elle n'existe pas
      if (!seriesData.season[seasonNum]) {
        seriesData.season[seasonNum] = {
          episodes: {}
        }
      }

      // Initialiser l'épisode s'il n'existe pas
      if (!seriesData.season[seasonNum].episodes[episodeNum]) {
        seriesData.season[seasonNum].episodes[episodeNum] = {
          videos: []
        }
      }

      // Ajouter la vidéo à l'épisode
      seriesData.season[seasonNum].episodes[episodeNum].videos.push({
        id: video.id.toString(), // Ajout de l'ID de la vidéo
        name: video.name || `Server ${video.id}`,
        url: video.url,
        lang: video.lang,
        quality: video.quality,
        pub: video.pub,
        play: video.play
      })
    })

    console.log(`Videos data for series ${id}:`, JSON.stringify(seriesData, null, 2))

    return NextResponse.json(seriesData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error fetching series videos:', error)
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
