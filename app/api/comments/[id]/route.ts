import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { text, user_id } = body
    const commentId = params.id

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

    // Mettre à jour le commentaire (RLS s'assure que seul le propriétaire peut modifier)
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        text: text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
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
      console.error('Erreur lors de la mise à jour du commentaire:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du commentaire' },
        { status: 500 }
      )
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Commentaire non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comment })
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
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const commentId = params.id

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

    // Supprimer le commentaire (RLS s'assure que seul le propriétaire peut supprimer)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erreur lors de la suppression du commentaire:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du commentaire' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Commentaire supprimé avec succès' })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}