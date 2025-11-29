import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServerClient } from '@/lib/supabase-server'

interface HistoryPayload {
  contentId: string
  contentType: 'movie' | 'series'
  season?: number | null
  episode?: number | null
  progressSeconds?: number | null
  durationSeconds?: number | null
  metadata?: Record<string, any> | null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = supabaseServerClient()
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('last_watched_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[HISTORY_GET] Supabase error:', error)
      return NextResponse.json({ error: 'Erreur Supabase' }, { status: 500 })
    }

    return NextResponse.json({ history: data ?? [] })
  } catch (error) {
    console.error('[HISTORY_GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  let payload: HistoryPayload
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  if (!payload?.contentId || !payload?.contentType) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const supabase = supabaseServerClient()
  const userId = session?.user?.id ?? null

  const normalizedSeason = typeof payload.season === 'number' ? payload.season : null
  const normalizedEpisode = typeof payload.episode === 'number' ? payload.episode : null

  try {
    let existingQuery = supabase
      .from('history')
      .select('id')
      .eq('content_id', payload.contentId)
      .eq('content_type', payload.contentType)

    existingQuery = userId ? existingQuery.eq('user_id', userId) : existingQuery.is('user_id', null)

    existingQuery = normalizedSeason !== null ? existingQuery.eq('season', normalizedSeason) : existingQuery.is('season', null)
    existingQuery = normalizedEpisode !== null ? existingQuery.eq('episode', normalizedEpisode) : existingQuery.is('episode', null)

    const { data: existing, error: existingError } = await existingQuery.maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[HISTORY_POST] Select error:', existingError)
      return NextResponse.json({ error: 'Erreur Supabase' }, { status: 500 })
    }

    const now = new Date().toISOString()
    const historyData = {
      user_id: userId,
      content_id: payload.contentId,
      content_type: payload.contentType,
      season: normalizedSeason,
      episode: normalizedEpisode,
      progress_seconds: payload.progressSeconds ?? 0,
      duration_seconds: payload.durationSeconds ?? null,
      last_watched_at: now,
      updated_at: now,
      metadata: payload.metadata ?? {}
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('history')
        .update(historyData)
        .eq('id', existing.id)

      if (updateError) {
        console.error('[HISTORY_POST] Update error:', updateError)
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
      }

      return NextResponse.json({ success: true, mode: 'updated' })
    }

    const { error: insertError } = await supabase.from('history').insert(historyData)

    if (insertError) {
      console.error('[HISTORY_POST] Insert error:', insertError)
      return NextResponse.json({ error: 'Erreur insertion' }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode: 'inserted' })
  } catch (error) {
    console.error('[HISTORY_POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  const supabase = supabaseServerClient()

  try {
    if (action === 'all') {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', session.user.id)

      if (error) {
        console.error('[HISTORY_DELETE_ALL] Supabase error:', error)
        return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
      }

      return NextResponse.json({ success: true, mode: 'deleted_all' })
    }

    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType')
    if (!contentId || (contentType !== 'movie' && contentType !== 'series')) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const seasonParam = searchParams.get('season')
    const episodeParam = searchParams.get('episode')
    const season = seasonParam ? parseInt(seasonParam, 10) : null
    const episode = episodeParam ? parseInt(episodeParam, 10) : null

    let deleteQuery = supabase
      .from('history')
      .delete()
      .eq('user_id', session.user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType)

    deleteQuery = season !== null ? deleteQuery.eq('season', season) : deleteQuery.is('season', null)
    deleteQuery = episode !== null ? deleteQuery.eq('episode', episode) : deleteQuery.is('episode', null)

    const { error } = await deleteQuery

    if (error) {
      console.error('[HISTORY_DELETE] Supabase error:', error)
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode: 'deleted_entry' })
  } catch (error) {
    console.error('[HISTORY_DELETE] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

