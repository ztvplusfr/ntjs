'use client'

import { useState, useEffect } from 'react'
import { 
  IconPlayerPlay,
  IconStar,
  IconUsers,
  IconWorld,
  IconBolt,
  IconShield,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTv,
  IconBrandApple, 
  IconBrandAndroid, 
  IconBrandXbox, 
  IconBrandWindows
} from '@tabler/icons-react'
import Link from 'next/link'
import Countdown from '@/components/countdown'
import PageHead from '@/components/page-head'

export default function WelcomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const features = [
    {
      icon: IconPlayerPlay,
      title: "Streaming Gratuit",
      description: "Profitez de milliers de films et séries en streaming HD sans abonnement"
    },
    {
      icon: IconStar,
      title: "Contenu Premium",
      description: "Accédez aux derniers films et séries en VF et VOSTFR"
    },
    {
      icon: IconUsers,
      title: "Communauté Active",
      description: "Rejoignez une communauté française passionnée de cinéma"
    },
    {
      icon: IconWorld,
      title: "100% Français",
      description: "Une plateforme créée et maintenue en France pour les utilisateurs francophones"
    },
    {
      icon: IconBolt,
      title: "Rapide & Fluide",
      description: "Une interface moderne et des serveurs optimisés pour une expérience parfaite"
    },
    {
      icon: IconShield,
      title: "Sécurisé",
      description: "Votre sécurité et votre confidentialité sont nos priorités"
    }
  ]

  const platforms = [
    { icon: IconDeviceDesktop, name: "Web", description: "Navigateur web" },
    { icon: IconDeviceMobile, name: "Mobile", description: "iOS & Android" },
    { icon: IconDeviceTv, name: "Smart TV", description: "Télévision connectée" },
    { icon: IconBrandWindows, name: "Windows", description: "PC Windows" },
    { icon: IconBrandApple, name: "macOS", description: "Mac et iPad" },
    { icon: IconDeviceDesktop, name: "Linux", description: "Distribution Linux" },
    { icon: IconBrandXbox, name: "Gaming", description: "Xbox & consoles" },
    { icon: IconBrandAndroid, name: "Android TV", description: "Box Android" }
  ]

  return (
    <>
      <PageHead
        title="Bienvenue sur ZTVPlus - Streaming Gratuit 100% Français"
        description="ZTVPlus est la plateforme de streaming gratuite 100% française créée par Hiro en 2023. Profitez de milliers de films et séries en HD sans abonnement."
        keywords="ZTVPlus, streaming gratuit, films, séries, français, Hiro, 2023, HD, VF, VOSTFR"
        image="/og-default.jpg"
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      <div className="bg-black text-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 flex items-center justify-center">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-black to-cyan-900/20" />
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Logo/Title */}
              <div className="mb-8">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                    ZTVPlus
                  </span>
                </h1>
                <div className="inline-flex items-center px-4 py-2 bg-sky-500/20 border border-sky-400/30 rounded-full mb-6">
                  <span className="text-sky-300 text-sm font-medium">🇫🇷 100% Français</span>
                </div>
              </div>

              {/* Main Description */}
              <div className="mb-12 max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-white">
                  La plateforme de streaming <span className="text-sky-400">gratuite</span> et <span className="text-cyan-400">100% française</span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
                  Créée par <span className="text-sky-400 font-semibold">🥷Hɪʀᴏ☄️</span> en <span className="text-cyan-400 font-semibold">2023</span>, 
                  ZTVPlus vous offre un accès illimité à des milliers de films et séries en streaming HD, 
                  entièrement gratuit et sans publicité intrusive.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/25"
                  >
                    <IconPlayerPlay size={20} />
                    Commencer à regarder
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 border border-gray-700"
                  >
                    Explorer le catalogue
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-sky-400 mb-2">10+</div>
                  <div className="text-sm text-gray-400">Films & Séries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">0€</div>
                  <div className="text-sm text-gray-400">Totalement Gratuit</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-sky-400 mb-2">HD</div>
                  <div className="text-sm text-gray-400">Qualité Premium</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">24/7</div>
                  <div className="text-sm text-gray-400">Disponible</div>
                </div>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Ces statistiques sont encore modestes suite à une grosse mise à jour de la plateforme, 
                mais elles se rempliront progressivement au fil de vos visionnages.
              </p>
            </div>
          </div>
        </section>

        {/* Anniversary / Countdown Section */}
        <section className="border-t border-gray-900">
          <Countdown />
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Pourquoi choisir <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">ZTVPlus</span> ?
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Découvrez toutes les fonctionnalités qui font de ZTVPlus la meilleure plateforme de streaming gratuite française
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:bg-gray-900/80 ${
                      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Platform Availability Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Disponible sur <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">tous vos appareils</span>
              </h2>
              <p className="text-lg text-gray-300">
                Profitez de ZTVPlus où que vous soyez, sur n'importe quel appareil connecté à internet
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {platforms.map((platform, index) => {
                const Icon = platform.icon
                return (
                  <div
                    key={index}
                    className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-700 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:scale-105 ${
                      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Icon size={32} className="text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{platform.name}</h3>
                    <p className="text-sm text-gray-400">{platform.description}</p>
                  </div>
                )
              })}
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Accès instantané via votre navigateur web - <span className="text-sky-400">aucune installation requise</span>
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all duration-300"
              >
                <IconWorld size={20} />
                Commencer maintenant
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-md rounded-2xl p-8 lg:p-12 border border-sky-400/30">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Prêt à commencer ? <span className="text-sky-400">C'est gratuit !</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers d'utilisateurs qui profitent déjà du meilleur streaming gratuit français. 
                Pas d'inscription, pas de carte bancaire, juste du divertissement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/25"
                >
                  <IconPlayerPlay size={20} />
                  Regarder maintenant
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 border border-gray-700"
                >
                  Explorer les contenus
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                ZTVPlus
              </h3>
              <p className="text-gray-400">Streaming gratuit 100% français</p>
            </div>
            <div className="text-gray-500 text-sm space-y-2">
              <p>Créé avec ❤️ par 🥷Hɪʀᴏ☄️ en 2023</p>
              <p>© 2023-2025 ZTVPlus. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
