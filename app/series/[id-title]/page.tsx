import { Metadata } from 'next'
import { generateSeriesMetadata } from '@/lib/metadata'
import SeriesPageClient from './client'

interface SeriesPageProps {
  params: Promise<{
    'id-title': string
  }>
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const id = resolvedParams['id-title'].split('-')[0]
  return generateSeriesMetadata({ id })
}

export default function SeriesPage({ params }: SeriesPageProps) {
  return <SeriesPageClient />
}
