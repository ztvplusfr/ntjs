import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-jwt'

const guildId = process.env.DISCORD_GUILD_ID
const botToken = process.env.DISCORD_BOT_TOKEN

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${user.id}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return NextResponse.json({ isMember: true })
    } else {
      return NextResponse.json({ isMember: false })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
