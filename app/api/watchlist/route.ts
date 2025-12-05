import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { supabase } from '@/lib/supabase'

const allowedTypes = ['movie', 'series']

async function requireToken(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token?.sub) {
    throw new Error('Unauthorized')
  }

  return token.sub
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireToken(request)

    const { data, error } = await supabase
      .from('watchlist')
      .select('tmdb_id, content_type')
      .eq('user_id', userId)

    if (error) {
      console.error('Watchlist select error:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    const stats = {
      total: (data || []).length,
      movies: (data || []).filter((item: any) => item.content_type === 'movie').length,
      series: (data || []).filter((item: any) => item.content_type === 'series').length
    }

    const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
    const details = await Promise.all(
      (data || []).map(async (item: any) => {
        const type = item.content_type === 'series' ? 'tv' : 'movie'
        if (!tmdbApiKey) {
          return {
            ...item,
            title: item.title ?? `${type} ${item.tmdb_id}`,
            poster: item.poster,
            overview: item.overview
          }
        }

        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/${type}/${item.tmdb_id}?api_key=${tmdbApiKey}&language=fr-FR`
          )
          if (!resp.ok) {
            throw new Error('TMDB error')
          }
          const payload = await resp.json()
          return {
            ...item,
            title: payload.title || payload.name,
            poster: payload.poster_path ? `https://image.tmdb.org/t/p/w300${payload.poster_path}` : item.poster,
            backdrop: payload.backdrop_path ? `https://image.tmdb.org/t/p/w780${payload.backdrop_path}` : item.backdrop,
            media_type: payload.media_type || type,
            release_date: payload.release_date || payload.first_air_date,
            overview: payload.overview
          }
        } catch (error) {
          return {
            ...item,
            title: item.title ?? `${type} ${item.tmdb_id}`
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      list: data || [],
      stats,
      details
    })
  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireToken(request)

    const body = await request.json()
    const tmdbId = Number(body.tmdbId ?? body.tmdb_id ?? '')
    const contentType = String(body.contentType ?? body.content_type ?? '').toLowerCase()

    if (!tmdbId || !allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('tmdb_id', tmdbId)

    if (error) {
      console.error('Watchlist delete error:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireToken(request)

    const body = await request.json()
    const tmdbId = Number(body.tmdbId ?? body.tmdb_id ?? '')
    const contentType = String(body.contentType ?? body.content_type ?? '').toLowerCase()

    if (!tmdbId || !allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('watchlist')
      .upsert(
        {
          user_id: userId,
          content_type: contentType,
          tmdb_id: tmdbId,
          added_at: now
        },
        {
          onConflict: 'user_id,content_type,tmdb_id'
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Watchlist insert error:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Watchlist API error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
  }
}
