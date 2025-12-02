import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const guildId = process.env.DISCORD_GUILD_ID
const botToken = process.env.DISCORD_BOT_TOKEN

export async function GET() {
  if (!guildId) {
    return NextResponse.json(
      { error: 'La variable DISCORD_GUILD_ID n’est pas configurée.' },
      { status: 500 }
    )
  }

  if (!botToken) {
    return NextResponse.json(
      { error: 'La variable DISCORD_BOT_TOKEN n’est pas configurée.' },
      { status: 500 }
    )
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Vous devez être connecté avec Discord pour vérifier votre adhésion.' },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${session.user.id}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: 'no-store',
      }
    )

    if (response.status === 404) {
      return NextResponse.json({ isMember: false })
    }

    if (!response.ok) {
      let additionalMessage = ''
      try {
        const payload = await response.json()
        if (payload?.message) {
          additionalMessage = ` (${payload.message})`
        }
      } catch {
        // ignore JSON parse errors
      }
      return NextResponse.json(
        { error: `Impossible de vérifier l’adhésion${additionalMessage}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ isMember: true })
  } catch (error) {
    console.error('Discord membership check failed', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la vérification de votre adhésion.' },
      { status: 500 }
    )
  }
}
