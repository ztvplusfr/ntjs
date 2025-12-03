import Hero from '../../components/hero'
import Countdown from '../../components/countdown'
import DiscordInvite from '../../components/discord-invite'
import MovieCarousel from '../../components/movie-carousel'
import LatestMovies from '../../components/latest-movies'
import LatestAnimes from '../../components/latest-animes'
import LatestSeries from '../../components/latest-series'
import StreamingDisclaimer from '../../components/streaming-disclaimer'
import DonationCta from '../../components/donation-cta'
import HistoryCarousel from '../../components/history-carousel'
import Top10Movies from '../../components/top-10-movies'
import Top10Series from '../../components/top-10-series'
import TodayReleasesCarousel from '../../components/today-releases-carousel'

export default function Browse() {
  return (
    <main className="overflow-x-hidden max-w-full">
      <Hero />
      <div className="overflow-x-hidden">
        <DonationCta />
        <TodayReleasesCarousel />
        <StreamingDisclaimer />
        <HistoryCarousel />
        <StreamingDisclaimer />
        <Countdown />
        <StreamingDisclaimer />
        <Top10Movies />
        <StreamingDisclaimer />
        <LatestMovies />
        <StreamingDisclaimer />
        <LatestAnimes />
        <StreamingDisclaimer />
        <DiscordInvite />
        <StreamingDisclaimer />
        <Top10Series />
        <StreamingDisclaimer />
        <LatestSeries />
      </div>
    </main>
  )
}
