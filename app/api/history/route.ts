import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
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

    // Validation des données
    if (!content_id || !content_type || !['movie', 'series'].includes(content_type) || !title) {
      return NextResponse.json({ error: 'Invalid content data' }, { status: 400 })
    }

    // Helper function to get current time in ISO format
    const getReunionDateTime = () => {
      // Utiliser l'heure du serveur directement (UTC)
      return new Date().toISOString()
    }

    const userId = token.sub // Discord user ID
    
    // Vérifier si une entrée existe déjà
    const existingEntry = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', content_id)
      .eq('content_type', content_type)
      .eq('season', season || null)
      .eq('episode', episode || null)
      .single()

    let result

    if (existingEntry.data) {
      // Mettre à jour l'entrée existante
      result = await supabase
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
          updated_at: getReunionDateTime()
        })
        .eq('id', existingEntry.data.id)
        .select()
        .single()
    } else {
      // Créer une nouvelle entrée
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
        created_at: getReunionDateTime(),
        updated_at: getReunionDateTime(),
        last_watched_at: getReunionDateTime()
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
        details: result.error.message,
        code: result.error.code 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('History API error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      console.error('No token found or missing sub')
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

    // Validation des données
    if (!content_id || !content_type || !['movie', 'series'].includes(content_type) || !title) {
      return NextResponse.json({ error: 'Invalid content data' }, { status: 400 })
    }

    // Helper function to get current time in ISO format
    const getReunionDateTime = () => {
      // Utiliser l'heure du serveur directement (UTC)
      return new Date().toISOString()
    }

    const userId = token.sub // Discord user ID

    // Mettre à jour l'entrée existante
    const updateResult = await supabase
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
        metadata,
        updated_at: getReunionDateTime()
      })
      .eq('user_id', userId)
      .eq('content_id', content_id)
      .eq('content_type', content_type)
      .eq('season', season || null)
      .eq('episode', episode || null)
      .select()
      .single()

    if (updateResult.error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: updateResult.error.message,
        code: updateResult.error.code 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updateResult.data })
  } catch (error) {
    console.error('History API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const contentType = searchParams.get('contentType')

    let query = supabase
      .from('history')
      .select('*')
      .eq('user_id', token.sub)
      .order('last_watched_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contentType && ['movie', 'series'].includes(contentType)) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ history: data || [] })
  } catch (error) {
    console.error('History GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    // Si action=all, supprimer tout l'historique de l'utilisateur
    if (action === 'all') {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', token.sub)

      if (error) {
        console.error('Supabase delete all error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Suppression d'un item spécifique
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
      .eq('user_id', token.sub)
      .eq('content_id', contentId)
      .eq('content_type', contentType)

    if (season) {
      query = query.eq('season', parseInt(season))
    }
    if (episode) {
      query = query.eq('episode', parseInt(episode))
    }

    const { error } = await query

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('History DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
