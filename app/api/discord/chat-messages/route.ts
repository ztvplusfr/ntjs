import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN
    const channelId = process.env.DISCORD_CHAT_CHANNEL_ID

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: 'Configuration Discord manquante' },
        { status: 500 }
      )
    }

    // Récupérer les 50 derniers messages du salon de discussion
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Éviter le cache
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Discord API error:', errorData)
      return NextResponse.json(
        { error: 'Impossible de récupérer les messages Discord' },
        { status: 500 }
      )
    }

    const messages = await response.json()
    console.log(`Fetched ${messages.length} messages from Discord chat`)

    // Formater les messages pour le chat
    const formattedMessages = messages.map((msg: any) => {
      console.log(`Processing message: ${msg.id} - ${msg.content?.substring(0, 50)}...`)
      
      return {
        id: msg.id,
        content: msg.content,
        author: {
          id: msg.author.id,
          username: msg.author.username,
          displayName: msg.author.global_name || msg.author.username,
          avatar: msg.author.avatar 
            ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(msg.author.discriminator) % 5}.png`
        },
        timestamp: msg.timestamp,
        attachments: msg.attachments?.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          url: att.url,
          contentType: att.content_type,
          isImage: att.content_type?.startsWith('image/') || 
                   att.filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
        })) || []
      }
    }).reverse() // Inverser pour afficher du plus ancien au plus récent

    console.log(`Formatted ${formattedMessages.length} messages for chat`)

    return NextResponse.json({
      messages: formattedMessages,
      total: formattedMessages.length,
      timestamp: new Date().toISOString() // Ajouter timestamp pour éviter le cache
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching Discord chat messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des messages' },
      { status: 500 }
    )
  }
}
