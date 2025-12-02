import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tguacmowepoinizvzhnv.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndWFjbW93ZXBvaW5penZ6aG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTUxMTAsImV4cCI6MjA3OTk3MTExMH0.9boMLlgB-6mZ8GWvJBE6XV-F0maTErrQAfKmXeDEgrk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
  },
})

export interface SeriesRelease {
  id: string
  tmdb_id: number
  season_number: number
  episode_number: number
  episode_title?: string
  release_date: string
  release_time?: string
  status: string
  seriesDetails?: any // Added to store TMDB data
}

export interface Video {
  id: number
  tmdb_id: number
  type: 'movie' | 'series'
  season_number?: number
  episode_number?: number
  name?: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
}

// Fonctions pour récupérer les vidéos depuis Supabase
export async function getMovieVideos(tmdbId: number): Promise<Video[] | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('type', 'movie')
      .order('quality', { ascending: false })

    if (error) {
      console.error('Error fetching movie videos:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error fetching movie videos:', error)
    return null
  }
}

export async function getSeriesVideos(tmdbId: number): Promise<Video[] | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('type', 'series')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })
      .order('quality', { ascending: false })

    if (error) {
      console.error('Error fetching series videos:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error fetching series videos:', error)
    return null
  }
}

export async function getEpisodeVideos(tmdbId: number, seasonNumber: number, episodeNumber: number): Promise<Video[] | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('type', 'series')
      .eq('season_number', seasonNumber)
      .eq('episode_number', episodeNumber)
      .order('quality', { ascending: false })

    if (error) {
      console.error('Error fetching episode videos:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error fetching episode videos:', error)
    return null
  }
}

// Fonctions CRUD pour les vidéos de films
export async function createMovieVideo(videoData: Omit<Video, 'id'>): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single()

    if (error) {
      console.error('Error creating movie video:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating movie video:', error)
    return null
  }
}

export async function updateMovieVideo(id: number, updates: Partial<Omit<Video, 'id'>>): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .eq('type', 'movie')
      .select()
      .single()

    if (error) {
      console.error('Error updating movie video:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error updating movie video:', error)
    return null
  }
}

export async function deleteMovieVideo(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('type', 'movie')

    if (error) {
      console.error('Error deleting movie video:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting movie video:', error)
    return false
  }
}

export async function updateMovieVideos(tmdbId: number, videos: Omit<Video, 'id' | 'tmdb_id' | 'type'>[]): Promise<boolean> {
  try {
    // Supprimer toutes les vidéos existantes pour ce film
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('type', 'movie')

    if (deleteError) {
      console.error('Error deleting existing movie videos:', deleteError)
      return false
    }

    // Insérer les nouvelles vidéos
    if (videos.length > 0) {
      const videosToInsert = videos.map(video => ({
        ...video,
        tmdb_id: tmdbId,
        type: 'movie' as const
      }))

      const { error: insertError } = await supabase
        .from('videos')
        .insert(videosToInsert)

      if (insertError) {
        console.error('Error inserting movie videos:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error updating movie videos:', error)
    return false
  }
}

// Fonctions CRUD pour les vidéos de séries
export async function updateSeriesVideos(tmdbId: number, seasonData: Record<string, { episodes: Record<string, { videos: Omit<Video, 'id' | 'tmdb_id' | 'type'>[] }> }>): Promise<boolean> {
  try {
    // Supprimer toutes les vidéos existantes pour cette série
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('type', 'series')

    if (deleteError) {
      console.error('Error deleting existing series videos:', deleteError)
      return false
    }

    // Collecter toutes les vidéos à insérer
    const videosToInsert: Omit<Video, 'id'>[] = []

    // Parcourir les saisons et épisodes
    for (const [seasonNumberStr, season] of Object.entries(seasonData)) {
      const seasonNumber = parseInt(seasonNumberStr)

      for (const [episodeNumberStr, episode] of Object.entries(season.episodes)) {
        const episodeNumber = parseInt(episodeNumberStr)

        // Ajouter chaque vidéo avec les informations de saison et épisode
        for (const video of episode.videos) {
          videosToInsert.push({
            ...video,
            tmdb_id: tmdbId,
            type: 'series' as const,
            season_number: seasonNumber,
            episode_number: episodeNumber
          })
        }
      }
    }

    // Insérer toutes les vidéos
    if (videosToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('videos')
        .insert(videosToInsert)

      if (insertError) {
        console.error('Error inserting series videos:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error updating series videos:', error)
    return false
  }
}

export async function getSeriesVideosStructured(tmdbId: number): Promise<Record<string, { episodes: Record<string, { videos: Video[] }> }> | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('type', 'series')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })
      .order('quality', { ascending: false })

    if (error) {
      console.error('Error fetching structured series videos:', error)
      return null
    }

    // Structurer les données par saison et épisode
    const structuredData: Record<string, { episodes: Record<string, { videos: Video[] }> }> = {}

    for (const video of data || []) {
      const seasonKey = video.season_number.toString()
      const episodeKey = video.episode_number.toString()

      if (!structuredData[seasonKey]) {
        structuredData[seasonKey] = { episodes: {} }
      }

      if (!structuredData[seasonKey].episodes[episodeKey]) {
        structuredData[seasonKey].episodes[episodeKey] = { videos: [] }
      }

      structuredData[seasonKey].episodes[episodeKey].videos.push(video)
    }

    return structuredData
  } catch (error) {
    console.error('Error fetching structured series videos:', error)
    return null
  }
}

// Fonctions pour gérer le contenu banni
export interface BannedContent {
  id: number
  tmdb_id: number
  content_type: 'movie' | 'tv'
  reason?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export async function isContentBanned(tmdbId: number, contentType: 'movie' | 'tv'): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('banned_content')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .eq('content_type', contentType)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking banned content:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking banned content:', error)
    return false
  }
}

export async function getBannedContent(): Promise<BannedContent[] | null> {
  try {
    const { data, error } = await supabase
      .from('banned_content')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching banned content:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error fetching banned content:', error)
    return null
  }
}

export async function banContent(tmdbId: number, contentType: 'movie' | 'tv', reason?: string, createdBy?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('banned_content')
      .insert([{
        tmdb_id: tmdbId,
        content_type: contentType,
        reason,
        created_by: createdBy
      }])

    if (error) {
      console.error('Error banning content:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error banning content:', error)
    return false
  }
}

export async function unbanContent(tmdbId: number, contentType: 'movie' | 'tv'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('banned_content')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('content_type', contentType)

    if (error) {
      console.error('Error unbanning content:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error unbanning content:', error)
    return false
  }
}

// Fonctions pour créer du contenu depuis TMDB
export interface ContentData {
  tmdb_id: number
  type: 'movie' | 'tv'
  title?: string
  name?: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  original_language: string
  genres: Array<{ id: number; name: string }>
  number_of_seasons?: number
  number_of_episodes?: number
  status?: string
  created_at: string
  updated_at: string
}

export async function createContent(contentData: ContentData): Promise<any | null> {
  try {
    // Vérifier si le contenu existe déjà
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('id')
      .eq('tmdb_id', contentData.tmdb_id)
      .eq('type', contentData.type)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing content:', checkError)
      return null
    }

    if (existingContent) {
      throw new Error('Content already exists')
    }

    // Créer le contenu
    const { data, error } = await supabase
      .from('content')
      .insert([contentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating content:', error)
    return null
  }
}
