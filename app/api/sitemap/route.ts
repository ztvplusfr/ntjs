import { NextRequest, NextResponse } from 'next/server'
import { SitemapStream, streamToPromise } from 'sitemap'
import { Readable } from 'stream'
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tguacmowepoinizvzhnv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// URLs statiques de votre site
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/browse', changefreq: 'daily', priority: 0.9 },
  { url: '/search', changefreq: 'weekly', priority: 0.8 },
  { url: '/agenda', changefreq: 'daily', priority: 0.8 },
  { url: '/chat', changefreq: 'monthly', priority: 0.7 },
  { url: '/discord', changefreq: 'monthly', priority: 0.7 },
  { url: '/player', changefreq: 'weekly', priority: 0.6 },
  { url: '/settings', changefreq: 'monthly', priority: 0.5 },
  { url: '/welcome', changefreq: 'monthly', priority: 0.5 },
  { url: '/auth/signin', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/test', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/error', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/discord', changefreq: 'monthly', priority: 0.4 }
]

// URLs dynamiques depuis Supabase
async function generateDynamicPages(): Promise<Array<{
  url: string
  changefreq: string
  priority: number
  lastmod: string
}>> {
  const dynamicPages: Array<{
    url: string
    changefreq: string
    priority: number
    lastmod: string
  }> = []
  
  try {
    // Récupérer les films depuis Supabase
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, updated_at, created_at')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    if (!moviesError && movies) {
      movies.forEach(movie => {
        const title = movie.title || ''
        const slug = title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
        
        dynamicPages.push({
          url: `/movies/${movie.id}-${slug || movie.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: movie.updated_at || movie.created_at || new Date().toISOString()
        })
        
        dynamicPages.push({
          url: `/watch/${movie.id}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: movie.updated_at || movie.created_at || new Date().toISOString()
        })
      })
    }

    // Récupérer les séries depuis Supabase
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('id, name, updated_at, created_at')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    if (!seriesError && series) {
      series.forEach(serie => {
        const name = serie.name || ''
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
        
        dynamicPages.push({
          url: `/series/${serie.id}-${slug || serie.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: serie.updated_at || serie.created_at || new Date().toISOString()
        })
      })
    }

    // Ajouter quelques URLs d'exemples pour les épisodes populaires
    const { data: episodes } = await supabase
      .from('episodes')
      .select('tmdb_id, season_number, episode_number, updated_at')
      .limit(100)

    if (episodes) {
      const uniqueSeries = [...new Set(episodes.map(ep => ep.tmdb_id))]
      uniqueSeries.forEach(tmdbId => {
        const seriesEpisodes = episodes.filter(ep => ep.tmdb_id === tmdbId)
        const seasons = [...new Set(seriesEpisodes.map(ep => ep.season_number))]
        
        seasons.forEach(season => {
          const seasonEpisodes = seriesEpisodes.filter(ep => ep.season_number === season)
          const episodesInSeason = [...new Set(seasonEpisodes.map(ep => ep.episode_number))]
          
          episodesInSeason.slice(0, 5).forEach(episode => { // Limiter à 5 épisodes par saison
            dynamicPages.push({
              url: `/watch/series/${tmdbId}/${season}/${episode}`,
              changefreq: 'weekly',
              priority: 0.6,
              lastmod: new Date().toISOString()
            })
          })
        })
      })
    }

  } catch (error) {
    console.error('Erreur lors de la génération des pages dynamiques:', error)
  }

  return dynamicPages
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier si la requête a un token secret (pour la sécurité)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // Token optionnel - si vous voulez sécuriser l'endpoint
    const expectedToken = process.env.SITEMAP_REGENERATION_TOKEN
    
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Génération du sitemap via API...')
    
    const dynamicPages = await generateDynamicPages()
    const allPages = [...staticPages, ...dynamicPages]

    // Créer le stream sitemap
    const smStream = new SitemapStream({
      hostname: process.env.NEXT_PUBLIC_SITE_URL || 'https://ztvplus.site',
      xmlns: {
        news: false,
        xhtml: false,
        image: false,
        video: false
      }
    })

    // Écrire les URLs dans le stream
    const links = allPages.map(page => ({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: page.lastmod || new Date().toISOString()
    }))

    // Créer le stream et générer le sitemap
    const stream = Readable.from(links)
    stream.pipe(smStream)

    // Générer le sitemap XML
    const xml = await streamToPromise(smStream)
    
    // Retourner le sitemap XML
    return new NextResponse(xml.toString(), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pour une régénération forcée (même logique que GET)
    return GET(request)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
