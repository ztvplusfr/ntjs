import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth-jwt'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      content_id,
      content_type,
      season,
      episode,
      title,
      poster,
      backdrop,
      episode_title,
      video_id,
      video_has_ads,
      video_lang,
      video_pub,
      video_quality,
      video_server,
      video_url,
      video_server_index,
      progress_seconds = 0,
      duration_seconds,
      metadata
    } = body

    if (!content_id || !content_type || !['movie', 'series'].includes(content_type) || !title) {
      return NextResponse.json({ error: 'Invalid content data' }, { status: 400 })
    }

    const getDateTime = () => new Date().toISOString()
    const userId = payload.user.id

    let existingEntryQuery = supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', content_id)
      .eq('content_type', content_type)
    
    if (content_type === 'series') {
      existingEntryQuery = existingEntryQuery
        .eq('season', season || null)
        .eq('episode', episode || null)
    }
    
    const existingEntry = await existingEntryQuery.single()
    let result

    if (existingEntry.data) {
      let updateQuery = supabase
        .from('history')
        .update({
          title,
          poster,
          backdrop,
          episode_title,
          video_id,
          video_has_ads,
          video_lang,
          video_pub,
          video_quality,
          video_server,
          video_url,
          video_server_index,
          progress_seconds,
          duration_seconds,
          metadata: metadata || existingEntry.data.metadata,
          updated_at: getDateTime()
        })
        .eq('id', existingEntry.data.id)
    
      result = await updateQuery.select().single()
    } else {
      const newEntry = {
        user_id: userId,
        content_id,
        content_type,
        title,
        poster,
        backdrop,
        season: season || null,
        episode: episode || null,
        episode_title,
        video_id,
        video_has_ads,
        video_lang,
        video_pub,
        video_quality,
        video_server,
        video_url,
        video_server_index,
        progress_seconds,
        duration_seconds,
        metadata,
        created_at: getDateTime(),
        updated_at: getDateTime(),
        last_watched_at: getDateTime()
      }

      result = await supabase
        .from('history')
        .insert(newEntry)
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: result.error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const contentType = searchParams.get('contentType')

    let query = supabase
      .from('history')
      .select('*')
      .eq('user_id', payload.user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contentType && ['movie', 'series'].includes(contentType)) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ history: data || [] })
  } catch (error) {
    console.error('History GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'all') {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', payload.user.id)

      if (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType')
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let query = supabase
      .from('history')
      .delete()
      .eq('user_id', payload.user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType)

    if (season) query = query.eq('season', parseInt(season))
    if (episode) query = query.eq('episode', parseInt(episode))

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('History DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
