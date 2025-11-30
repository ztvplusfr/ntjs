import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tguacmowepoinizvzhnv.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndWFjbW93ZXBvaW5penZ6aG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTUxMTAsImV4cCI6MjA3OTk3MTExMH0.9boMLlgB-6mZ8GWvJBE6XV-F0maTErrQAfKmXeDEgrk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
