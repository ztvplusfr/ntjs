import { NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth-jwt'

const guildId = process.env.DISCORD_GUILD_ID
const botToken = process.env.DISCORD_BOT_TOKEN

export async function GET(request: Request) {
  try {
    const payload = await verifyJWT(request)
    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${payload.user.id}`, {
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
