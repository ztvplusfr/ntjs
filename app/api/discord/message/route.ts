import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string
    const image = formData.get('image') as File
    const userName = formData.get('userName') as string
    const userAvatar = formData.get('userAvatar') as string
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const movieId = formData.get('movieId') as string
    const movieTitle = formData.get('movieTitle') as string

    if (!content && !image) {
      return NextResponse.json(
        { error: 'Veuillez fournir un message ou une image' },
        { status: 400 }
      )
    }

    // Utiliser le webhook approprié selon le type de message
    const webhookUrl = (type === 'movie_request' || type === 'series_request') 
      ? process.env.DISCORD_REQUESTS_WEBHOOK_URL 
      : process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook Discord non configuré' },
        { status: 500 }
      )
    }

    // Créer le message Discord avec les informations utilisateur pour le support
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const timeStr = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Préparer le FormData pour Discord
    const discordFormData = new FormData()
    
    // Créer un embed différent selon le type
    let embed: any
    
    if (type === 'movie_request') {
      embed = {
        title: "🎬 Nouvelle Demande de Film",
        color: 0x9333EA, // Violet
        author: {
          name: userName || "Utilisateur Anonyme",
          icon_url: userAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        fields: [
          {
            name: "🎞️ Film Demandé",
            value: `**${movieTitle || 'Non spécifié'}**`,
            inline: false
          },
          {
            name: "🆔 ID TMDB",
            value: `**${movieId || 'Non spécifié'}**`,
            inline: true
          },
          {
            name: "🌐 Plateforme",
            value: "**ZTVPlus**",
            inline: true
          },
          {
            name: "📅 Date",
            value: `**${dateStr}**`,
            inline: true
          },
          {
            name: "🕐 Heure",
            value: `**${timeStr}**`,
            inline: true
          },
          ...(content ? [{
            name: "💬 Message",
            value: content,
            inline: false
          }] : [])
        ],
        footer: {
          text: userId ? `🆔 ID: ${userId}` : "❌ Non connecté"
        },
        timestamp: now.toISOString()
      }
    } else if (type === 'series_request') {
      embed = {
        title: "📺 Nouvelle Demande de Série",
        color: 0x0EA5E9, // Bleu
        author: {
          name: userName || "Utilisateur Anonyme",
          icon_url: userAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        fields: [
          {
            name: "📺 Série Demandée",
            value: `**${movieTitle || 'Non spécifié'}**`, // Utiliser movieTitle pour seriesTitle
            inline: false
          },
          {
            name: "🆔 ID TMDB",
            value: `**${movieId || 'Non spécifié'}**`, // Utiliser movieId pour seriesId
            inline: true
          },
          {
            name: "🌐 Plateforme",
            value: "**ZTVPlus**",
            inline: true
          },
          {
            name: "📅 Date",
            value: `**${dateStr}**`,
            inline: true
          },
          {
            name: "🕐 Heure",
            value: `**${timeStr}**`,
            inline: true
          },
          ...(content ? [{
            name: "💬 Message",
            value: content,
            inline: false
          }] : [])
        ],
        footer: {
          text: userId ? `🆔 ID: ${userId}` : "❌ Non connecté"
        },
        timestamp: now.toISOString()
      }
    } else {
      embed = {
        title: "📩 Nouveau Message Support",
        color: 0x5865F2, // Bleu Discord
        author: {
          name: userName || "Utilisateur Anonyme",
          icon_url: userAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        fields: [
          {
            name: "🌐 Plateforme",
            value: "**ZTVPlus**",
            inline: true
          },
          {
            name: "📅 Date",
            value: `**${dateStr}**`,
            inline: true
          },
          {
            name: "🕐 Heure",
            value: `**${timeStr}**`,
            inline: true
          }
        ],
        ...(content ? [{
          name: "💬 Message",
          value: content,
          inline: false
        }] : []),
        ...(image ? [{
          name: "📎 Pièce Jointe",
          value: `*Voir l'image ci-dessous*`,
          inline: false
        }] : []),
        footer: {
          text: userId ? `🆔 ID: ${userId}` : "❌ Non connecté"
        },
        timestamp: now.toISOString()
      }
    }

    discordFormData.append('payload_json', JSON.stringify({
      username: "ZTVPlus Support",
      avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
      embeds: [embed],
      content: type === 'movie_request' 
        ? "🎬 **Nouvelle demande de film reçue depuis ZTVPlus !**" 
        : type === 'series_request'
          ? "📺 **Nouvelle demande de série reçue depuis ZTVPlus !**"
          : image 
            ? "👋 **Nouveau message reçu depuis ZTVPlus avec image !**" 
            : "👋 **Nouveau message reçu depuis ZTVPlus !**"
    }))

    // Si une image est jointe, l'ajouter directement au FormData
    if (image) {
      // Vérifier la taille (max 8MB pour Discord)
      if (image.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'L\'image ne doit pas dépasser 8MB' },
          { status: 400 }
        )
      }

      // Ajouter le fichier directement au FormData Discord
      discordFormData.append('file1', image, image.name)
      
      console.log('Image added to Discord support FormData:', image.name, `${(image.size / 1024 / 1024).toFixed(2)}MB`)
    }

    // Envoyer directement au webhook Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: discordFormData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Discord support webhook error:', errorData)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi à Discord' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending Discord support message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
