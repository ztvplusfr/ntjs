import Hero from '../components/hero'
import Countdown from '../components/countdown'
import DiscordInvite from '../components/discord-invite'
import MovieCarousel from '../components/movie-carousel'
import LatestMovies from '../components/latest-movies'
import LatestAnimes from '../components/latest-animes'
import LatestSeries from '../components/latest-series'
import StreamingDisclaimer from '../components/streaming-disclaimer'
import DonationCta from '../components/donation-cta'
import HistoryCarousel from '../components/history-carousel'

export default function Home() {
  return (
    <main className="overflow-x-hidden max-w-full">
      <Hero />
      <div className="overflow-x-hidden">
        <DonationCta />
        <HistoryCarousel />
        <Countdown />
        <LatestMovies />
        <StreamingDisclaimer />
        <LatestAnimes />
        <DiscordInvite />
        <LatestSeries />
      </div>
    </main>
  )
}
