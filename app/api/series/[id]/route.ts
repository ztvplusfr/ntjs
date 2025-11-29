import { NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'

interface VideoServer {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
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

    // Vérifier d'abord si le fichier existe avec le SDK Vercel Blob
    const blobPathname = `series/${id}.json`

    try {
      // Vérifier si le blob existe
      const blobInfo = await head(blobPathname, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      })

      if (!blobInfo) {
        console.error(`Blob not found for series ${id}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour cette série' },
          { status: 404 }
        )
      }

      // Récupérer les données depuis l'URL du blob avec le token d'autorisation
      const response = await fetch(blobInfo.url, {
        headers: {
          'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        }
      })

      if (!response.ok) {
        console.error(`Failed to fetch videos for series ${id}: ${response.status}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour cette série' },
          { status: 404 }
        )
      }

      const videosData: SeriesVideosData = await response.json()

      // Valider la structure des données
      if (!videosData || !videosData.season) {
        console.error(`Invalid videos data structure for series ${id}`)
        return NextResponse.json(
          { error: 'Format de données invalide' },
          { status: 500 }
        )
      }

      // Logger les données récupérées pour debug
      console.log(`Videos data for series ${id}:`, JSON.stringify(videosData, null, 2))

      return NextResponse.json(videosData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })

    } catch (blobError) {
      console.error(`Blob access error for series ${id}:`, blobError)

      // Fallback: essayer l'ancienne méthode au cas où
      const videosUrl = `https://owpcw6r7bvjk25ny.public.blob.vercel-storage.com/series/${id}.json`
      const response = await fetch(videosUrl)

      if (!response.ok) {
        console.error(`Failed to fetch videos for series ${id}: ${response.status}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour cette série' },
          { status: 404 }
        )
      }

      const videosData: SeriesVideosData = await response.json()

      // Valider la structure des données
      if (!videosData || !videosData.season) {
        console.error(`Invalid videos data structure for series ${id}`)
        return NextResponse.json(
          { error: 'Format de données invalide' },
          { status: 500 }
        )
      }

      console.log(`Videos data for series ${id} (fallback):`, JSON.stringify(videosData, null, 2))

      return NextResponse.json(videosData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

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
