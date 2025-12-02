'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Film, Tv, Search, TrendingUp, Clock, Star, ChevronRight, Smartphone, Tablet, Monitor, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import PageHead from '@/components/page-head'

interface Movie {
  id: number
  title: string
  poster_path: string
  vote_average: number
  release_date: string
}

interface Serie {
  id: number
  name: string
  poster_path: string
  vote_average: number
  first_air_date: string
}

export default function BrowserPage() {
  const router = useRouter()
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [trendingSeries, setTrendingSeries] = useState<Serie[]>([])
  const [loading, setLoading] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here'

        // Charger les films tendances
        const moviesResponse = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=fr-FR`
        )
        const moviesData = await moviesResponse.json()
        setTrendingMovies(moviesData.results?.slice(0, 8) || [])

        // Charger les séries tendances
        const seriesResponse = await fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=fr-FR`
        )
        const seriesData = await seriesResponse.json()
        setTrendingSeries(seriesData.results?.slice(0, 8) || [])
      } catch (error) {
        console.error('Error loading content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()

    // Détecter si l'app est déjà installée
    const checkInstalled = () => {
      if ('standalone' in window.navigator && (window.navigator as any).standalone) {
        setIsInstalled(true)
      } else if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  const createSlug = (title: string, id: number): string => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${id}-${slug}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de ZTVPlus...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHead
        title="ZTVPlus - Streaming HD gratuit"
        description="Découvrez ZTVPlus, votre application de streaming HD gratuite. Films et séries en VF/VOSTFR disponibles sur mobile, tablette et desktop."
        keywords="streaming, gratuit, films, séries, VF, VOSTFR, PWA, application mobile"
      />

      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

          <div className="relative px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                {/* Logo */}
                <div className="mb-6">
                  <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                    ZTVPlus
                  </h1>
                  <p className="text-xl sm:text-2xl text-gray-300 font-light">
                    Streaming HD gratuit
                  </p>
                </div>

                {/* PWA Install Button */}
                {!isInstalled && deferredPrompt && (
                  <div className="mb-8">
                    <button
                      onClick={handleInstall}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <Smartphone size={20} />
                      Installer l'application
                      <Tablet size={20} />
                    </button>
                    <p className="text-sm text-gray-400 mt-2">
                      Disponible sur mobile, tablette et desktop
                    </p>
                  </div>
                )}

                {/* Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                    <Film className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">Films HD</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                    <Tv className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">Séries</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                    <Monitor className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">Multi-écrans</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                    <Gamepad2 className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">Gratuit</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/movies"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white font-semibold transition-colors"
                  >
                    <Film size={20} />
                    Explorer les films
                  </Link>
                  <Link
                    href="/series"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold transition-colors"
                  >
                    <Tv size={20} />
                    Explorer les séries
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white font-semibold transition-colors"
                  >
                    <Search size={20} />
                    Rechercher
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Content */}
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Trending Movies */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  <TrendingUp className="text-purple-400" />
                  Films tendances
                </h2>
                <Link
                  href="/movies"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                >
                  Voir tout <ChevronRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {trendingMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${createSlug(movie.title, movie.id)}`}
                    className="group"
                  >
                    <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={32} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2 mb-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Star size={12} className="text-yellow-400" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                      <span>•</span>
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Trending Series */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  <TrendingUp className="text-blue-400" />
                  Séries tendances
                </h2>
                <Link
                  href="/series"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                >
                  Voir tout <ChevronRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {trendingSeries.map((serie) => (
                  <Link
                    key={serie.id}
                    href={`/series/${createSlug(serie.name, serie.id)}`}
                    className="group"
                  >
                    <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                      {serie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${serie.poster_path}`}
                          alt={serie.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv size={32} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                      {serie.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Star size={12} className="text-yellow-400" />
                      <span>{serie.vote_average.toFixed(1)}</span>
                      <span>•</span>
                      <span>{new Date(serie.first_air_date).getFullYear()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Features Section */}
            <section className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">
                Pourquoi ZTVPlus ?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Disponible partout</h3>
                  <p className="text-gray-400 text-sm">
                    Regardez vos films et séries préférés sur tous vos appareils
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <Star className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Qualité HD</h3>
                  <p className="text-gray-400 text-sm">
                    Streaming en haute définition avec sous-titres français
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <Play className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">100% gratuit</h3>
                  <p className="text-gray-400 text-sm">
                    Aucun abonnement requis, profitez du contenu gratuitement
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
