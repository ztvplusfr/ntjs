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
