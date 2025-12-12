'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Hero from '../../components/hero'
import Countdown from '../../components/countdown'
import DiscordInvite from '../../components/discord-invite'
import LatestMovies from '../../components/latest-movies'
import LatestAnimes from '../../components/latest-animes'
import LatestSeries from '../../components/latest-series'
import DonationCta from '../../components/donation-cta'
import HistoryCarousel from '../../components/history-carousel'
import Top10Movies from '../../components/top-10-movies'
import Top10Series from '../../components/top-10-series'
import TodayReleasesCarousel from '../../components/today-releases-carousel'

export default function Browse() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-600 border-t-white"></div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect in progress
  }

  return (
    <main className="overflow-x-hidden max-w-full">
      <div className="absolute top-0 left-0 w-full z-10">
        <Hero />
      </div>
      <div className="relative z-20 mt-[100vh] overflow-x-hidden space-y-8 py-8 bg-black">
        <HistoryCarousel />
        <TodayReleasesCarousel />
        <Top10Movies />
        <LatestMovies />
        <Top10Series />
        <LatestSeries />
        <LatestAnimes />
        <DiscordInvite />
        <DonationCta />
        <Countdown />
      </div>
    </main>
  )
}
