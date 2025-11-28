import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Initialisation Redis avec Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { id, type } = await request.json()

    if (!id || !type || !['movie', 'series'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Clé pour stocker les vues
    const key = `views:${type}:${id}`
    
    // Incrémenter le compteur de vues
    const currentViews = await redis.incr(key)
    
    // Si c'est la première vue, définir une expiration (1 an)
    if (currentViews === 1) {
      await redis.expire(key, 365 * 24 * 60 * 60) // 1 an en secondes
    }

    return NextResponse.json({
      success: true,
      views: currentViews,
      id,
      type
    })

  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
