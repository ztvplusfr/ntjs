import { NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'

interface VideoServer {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  hasAds?: boolean
  server?: string
}

interface MovieVideos {
  videos: VideoServer[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier d'abord si le fichier existe avec le SDK Vercel Blob
    const blobPathname = `movies/${id}.json`

    try {
      // Vérifier si le blob existe
      const blobInfo = await head(blobPathname, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      })

      if (!blobInfo) {
        console.error(`Blob not found for movie ${id}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour ce film' },
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
        console.error(`Failed to fetch videos for movie ${id}: ${response.status}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour ce film' },
          { status: 404 }
        )
      }

      const videosData: MovieVideos = await response.json()

      // Valider la structure des données
      if (!videosData || !videosData.videos) {
        console.error(`Invalid videos data structure for movie ${id}`)
        return NextResponse.json(
          { error: 'Format de données invalide' },
          { status: 500 }
        )
      }

      // Transformer les données pour ajouter les propriétés manquantes
      const transformedVideos = videosData.videos.map((video: any) => ({
        ...video,
        hasAds: video.hasAds ?? video.pub === 1,
        server: video.server ?? video.name
      }))

      // Logger les données récupérées pour debug
      console.log(`Videos data for movie ${id}:`, JSON.stringify({ videos: transformedVideos }, null, 2))

      return NextResponse.json({ videos: transformedVideos }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })

    } catch (blobError) {
      console.error(`Blob access error for movie ${id}:`, blobError)

      // Fallback: essayer l'ancienne méthode au cas où
      const blobBaseUrl = process.env.BLOB_PUBLIC_URL
      const videosUrl = blobBaseUrl ? `${blobBaseUrl}/movies/${id}.json` : `https://owpcw6r7bvjk25ny.public.blob.vercel-storage.com/movies/${id}.json`
      const response = await fetch(videosUrl)

      if (!response.ok) {
        console.error(`Failed to fetch videos for movie ${id}: ${response.status}`)
        return NextResponse.json(
          { error: 'Vidéos non disponibles pour ce film' },
          { status: 404 }
        )
      }

      const videosData: MovieVideos = await response.json()

      // Valider la structure des données
      if (!videosData || !videosData.videos) {
        console.error(`Invalid videos data structure for movie ${id}`)
        return NextResponse.json(
          { error: 'Format de données invalide' },
          { status: 500 }
        )
      }

      // Transformer les données pour ajouter les propriétés manquantes
      const transformedVideos = videosData.videos.map((video: any) => ({
        ...video,
        hasAds: video.hasAds ?? video.pub === 1,
        server: video.server ?? video.name
      }))

      console.log(`Videos data for movie ${id} (fallback):`, JSON.stringify({ videos: transformedVideos }, null, 2))

      return NextResponse.json({ videos: transformedVideos }, {
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
    console.error('Error fetching movie videos:', error)
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
