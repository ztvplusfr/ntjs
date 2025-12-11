import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateEpisodeMetadata } from '@/lib/metadata'
import WatchSeriesPageClient from './client'

interface WatchSeriesPageProps {
  params: Promise<{
    id: string
    season: string
    episode: string
  }>
}

export async function generateMetadata({ params }: WatchSeriesPageProps): Promise<Metadata> {
  const resolvedParams = await params
  return generateEpisodeMetadata({
    seriesId: resolvedParams.id,
    season: resolvedParams.season,
    episode: resolvedParams.episode
  })
}

export default async function WatchSeriesPage({ params }: WatchSeriesPageProps) {
  return <WatchSeriesPageClient />
}
