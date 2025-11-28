import { NextRequest, NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'

interface Video {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  hasAds: boolean
  server: string
}

interface VideoResponse {
  videos: Video[]
}

// Récupérer les vidéos depuis Vercel Blob
async function getVideosFromBlob(movieId: string): Promise<VideoResponse | null> {
  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
  
  if (!BLOB_TOKEN) {
    console.log('Vercel Blob token not configured')
    return null
  }

  try {
    // Lister les blobs pour trouver le fichier du film
    const { blobs } = await list({
      token: BLOB_TOKEN,
      prefix: `movies/`
    })

    // Chercher le fichier spécifique au movieId
    const movieBlob = blobs.find(blob => 
      blob.pathname.includes(`/${movieId}.json`)
    )

    if (!movieBlob) {
      console.log('No blob found for movie:', movieId)
      return null
    }

    // Récupérer le contenu du blob
    const response = await fetch(movieBlob.url)
    
    if (!response.ok) {
      console.log('Failed to fetch blob content:', response.status)
      return null
    }

    const data = await response.json()
    
    // Transform the data to ensure required properties
    const transformedVideos = data.videos.map((video: any) => ({
      ...video,
      hasAds: video.hasAds ?? video.pub === 1,
      server: video.server ?? video.name
    }))
    
    console.log('Blob data retrieved for movie:', movieId)
    return { videos: transformedVideos }
  } catch (error) {
    console.error('Error getting videos from Blob:', error)
    return null
  }
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

  try {
    // Récupérer depuis Vercel Blob
    const videos = await getVideosFromBlob(movieId)
    
    if (!videos) {
      return NextResponse.json(
        { error: 'No videos found for this movie' },
        { status: 404 }
      )
    }

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error in videos API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, videos } = body

    if (!movieId || !videos) {
      return NextResponse.json(
        { error: 'Movie ID and videos are required' },
        { status: 400 }
      )
    }

    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

    if (!BLOB_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel Blob not configured' },
        { status: 500 }
      )
    }

    const videoData = { videos }

    // Stocker dans Vercel Blob
    const blob = await put(`movies/${movieId}.json`, JSON.stringify(videoData, null, 2), {
      access: 'public',
      token: BLOB_TOKEN,
    })

    console.log('Videos stored successfully in blob:', blob.url)

    return NextResponse.json({ 
      message: 'Videos stored successfully',
      movieId,
      blobUrl: blob.url,
      count: videos.length
    })
  } catch (error) {
    console.error('Error storing videos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('id')

  if (!movieId) {
    return NextResponse.json(
      { error: 'Movie ID is required' },
      { status: 400 }
    )
  }

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

  if (!BLOB_TOKEN) {
    return NextResponse.json(
      { error: 'Vercel Blob not configured' },
      { status: 500 }
    )
  }

  try {
    // Lister les blobs pour trouver le fichier à supprimer
    const { blobs } = await list({
      token: BLOB_TOKEN,
      prefix: `movies/`
    })

    // Chercher le fichier spécifique au movieId
    const movieBlob = blobs.find(blob => 
      blob.pathname.includes(`/${movieId}.json`)
    )

    if (!movieBlob) {
      return NextResponse.json(
        { error: 'No videos found for this movie' },
        { status: 404 }
      )
    }

    // Supprimer le blob via l'API Vercel
    const deleteResponse = await fetch(`https://api.vercel.com/v1/blob${movieBlob.url.split('vercel-storage.com')[1]}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN || BLOB_TOKEN}`,
      },
    })

    if (!deleteResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to delete videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Videos deleted successfully' })
  } catch (error) {
    console.error('Error deleting videos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
