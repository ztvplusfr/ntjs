import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string
    const image = formData.get('image') as File
    const userName = formData.get('userName') as string
    const userAvatar = formData.get('userAvatar') as string
    const userId = formData.get('userId') as string

    if (!content && !image) {
      return NextResponse.json(
        { error: 'Veuillez fournir un message ou une image' },
        { status: 400 }
      )
    }

    // Utiliser le bot token pour envoyer dans le salon de discussion
    const botToken = process.env.DISCORD_BOT_TOKEN
    const channelId = process.env.DISCORD_CHAT_CHANNEL_ID

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: 'Configuration Discord bot manquante' },
        { status: 500 }
      )
    }

    // Préparer le message pour le bot
    let messagePayload: any = {
      content: ''
    }

    // Ajouter @username au début du message
    if (userName) {
      // Extraire le username du nom complet (prendre la première partie ou formater)
      const username = userName.toLowerCase().replace(/\s+/g, '_')
      messagePayload.content += `@${username}\n`
    }
    
    // Ajouter le contenu du message
    if (content) {
      messagePayload.content += content
    }

    // Ajouter l'avatar utilisateur si disponible (comme embed)
    if (userAvatar || userId) {
      messagePayload.embeds = [{
        color: 0x06D6A0, // Vert turquoise pour le chat
        ...(userAvatar && {
          thumbnail: {
            url: userAvatar
          }
        }),
        ...(userId && {
          footer: {
            text: `🆔 ${userId}`
          }
        }),
        timestamp: new Date().toISOString()
      }]
    }

    // Si une image est jointe, l'envoyer en multipart
    if (image) {
      // Vérifier la taille (max 8MB pour Discord)
      if (image.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'L\'image ne doit pas dépasser 8MB' },
          { status: 400 }
        )
      }

      // Créer FormData pour l'upload avec le bot
      const botFormData = new FormData()
      botFormData.append('payload_json', JSON.stringify(messagePayload))
      botFormData.append('file1', image, image.name)
      
      console.log('Sending image via Discord bot to chat:', image.name, `${(image.size / 1024 / 1024).toFixed(2)}MB`)

      // Envoyer via le bot Discord
      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
          },
          body: botFormData,
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Discord bot chat error:', errorData)
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi via le bot Discord' },
          { status: 500 }
        )
      }
    } else {
      // Envoyer le message texte via le bot
      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload),
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Discord bot chat error:', errorData)
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi via le bot Discord' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès via le bot' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending Discord chat message via bot:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
