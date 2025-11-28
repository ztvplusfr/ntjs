import { NextRequest, NextResponse } from 'next/server'

interface DiscordMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    global_name?: string
    avatar?: string
  }
  timestamp: string
  attachments?: Array<{
    id: string
    filename: string
    size: number
    url: string
    content_type?: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN
    const channelId = process.env.DISCORD_CHANNEL_ID

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: 'Bot token ou channel ID manquant' },
        { status: 500 }
      )
    }

    // Récupérer les messages du salon Discord
    const discordApiUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`
    
    const response = await fetch(discordApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Discord API error:', errorData)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages Discord' },
        { status: 500 }
      )
    }

    const messages: DiscordMessage[] = await response.json()
    
    // Formater les messages pour le frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        displayName: msg.author.global_name || msg.author.username,
        avatar: msg.author.avatar 
          ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${(parseInt(msg.author.id) >> 22) % 6}.png`
      },
      timestamp: msg.timestamp,
      attachments: msg.attachments?.map(att => ({
        id: att.id,
        filename: att.filename,
        size: att.size,
        url: att.url,
        contentType: att.content_type,
        isImage: att.content_type?.startsWith('image/')
      })) || []
    })).reverse() // Ordre chronologique (plus ancien au plus récent)

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })

  } catch (error) {
    console.error('Error fetching Discord messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
