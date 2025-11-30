import { Metadata } from 'next'
import { supabase, SeriesRelease } from '@/lib/supabase'
import AgendaClient from './agenda-client'

export const metadata: Metadata = {
  title: 'Agenda - Sorties de séries | ZTVPlus',
  description: 'Découvrez toutes les sorties de séries à venir avec notre agenda complet. Dates de sortie, épisodes et informations sur les prochains épisodes.',
  keywords: 'agenda séries, sorties séries, calendrier séries, dates de sortie, épisodes à venir',
  openGraph: {
    title: 'Agenda des sorties de séries - ZTVPlus',
    description: 'Consultez notre agenda complet des sorties de séries à venir',
    url: '/agenda',
    siteName: 'ZTVPlus',
    type: 'website',
  },
  alternates: {
    canonical: '/agenda',
  },
}

// Helper function to get series releases
async function getSeriesReleases(): Promise<SeriesRelease[]> {
  try {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Fetching series releases...')
    
    const { data, error } = await supabase
      .from('series_releases')
      .select('*')
      .gte('release_date', new Date().toISOString().split('T')[0])
      .order('release_date', { ascending: true })

    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Error fetching series releases:', error)
      return []
    }

    console.log('Fetched releases:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('Error fetching series releases:', error)
    return []
  }
}

// Helper function to get week dates
function getWeekDates() {
  const today = new Date()
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    weekDates.push(date)
  }
  
  return weekDates
}

// Helper function to get week date range
function getWeekDateRange(weekDates: Date[]) {
  const firstDay = weekDates[0]
  const lastDay = weekDates[6]
  
  const firstDayFormatted = firstDay.toLocaleDateString('fr-FR', { day: 'numeric' })
  const lastDayFormatted = lastDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  
  return `du ${firstDayFormatted} au ${lastDayFormatted}`
}

// Helper function to format day
function formatDay(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function isToday(date: Date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export default async function AgendaPage() {
  const seriesReleases = await getSeriesReleases()
  const weekDates = getWeekDates()
  
  return <AgendaClient seriesReleases={seriesReleases} weekDates={weekDates} />
}
