import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Initialisation Redis avec Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type || !['movie', 'series'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Clé pour stocker les vues
    const key = `views:${type}:${id}`
    
    // Récupérer la valeur actuelle sans l'incrémenter
    const currentViews = await redis.get<number>(key)
    
    return NextResponse.json({
      success: true,
      views: currentViews || 0,
      id,
      type
    })

  } catch (error) {
    console.error('Error getting views:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
