import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const body = await request.json()
    const { text, user_id } = body
    const replyId = params.replyId

    if (!text || !user_id) {
      return NextResponse.json(
        { error: 'text et user_id sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est authentifié
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Mettre à jour la réponse (RLS s'assure que seul le propriétaire peut modifier)
    const { data: reply, error } = await supabase
      .from('comment_replies')
      .update({
        text: text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', replyId)
      .eq('user_id', user_id)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la réponse:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la réponse' },
        { status: 500 }
      )
    }

    if (!reply) {
      return NextResponse.json(
        { error: 'Réponse non trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const replyId = params.replyId

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id est requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est authentifié
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Supprimer la réponse (RLS s'assure que seul le propriétaire peut supprimer)
    const { error } = await supabase
      .from('comment_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erreur lors de la suppression de la réponse:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la réponse' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Réponse supprimée avec succès' })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}