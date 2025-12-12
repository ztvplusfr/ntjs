import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }

  const { path } = await params
  const pathString = path.join('/')
  const searchParams = new URL(request.url).searchParams
  
  // Add API key to params
  searchParams.set('api_key', TMDB_API_KEY)
  
  const tmdbUrl = `${TMDB_BASE_URL}/${pathString}?${searchParams.toString()}`

  try {
    const response = await fetch(tmdbUrl)
    const data = await response.json()

    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 })
  }
}
