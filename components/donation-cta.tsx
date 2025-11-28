'use client'

import Link from 'next/link'
import { ShieldCheck, HeartHandshake, CreditCard } from 'lucide-react'

export default function DonationCta() {
  return (
    <section className="w-full px-2 sm:px-4 lg:px-8 py-10">
      <div className="w-full max-w-7xl mx-auto bg-gradient-to-r from-sky-900/80 via-sky-800/80 to-indigo-900/80 border border-sky-700/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[2.1fr_1.3fr]">
          {/* Texte */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-widest mb-3">
              <HeartHandshake className="w-4 h-4" />
              <span>Soutenir la plateforme</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Aidez-nous à financer de nouvelles infrastructures
            </h2>

            <p className="text-sm sm:text-base text-sky-100/90 mb-4 leading-relaxed">
              ZTVPlus est financé par la communauté. Vos dons nous permettent
              d&apos;acheter de nouveaux serveurs, d&apos;améliorer la stabilité du site
              et d&apos;offrir une meilleure qualité de streaming à tout le monde.
            </p>

            <div className="flex flex-col gap-2 text-xs sm:text-sm text-sky-100/80 mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Paiement 100% sécurisé via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Aucune information bancaire stockée sur nos serveurs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span>Chaque contribution, même petite, fait réellement la différence</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="https://buy.stripe.com/7sY9AU9eo4CzbBr5oS2cg00"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-sky-500/30"
              >
                Faire un don sécurisé
              </Link>
              <p className="text-[11px] sm:text-xs text-sky-100/70">
                En faisant un don, vous soutenez directement l&apos;hébergement et
                l&apos;évolution de ZTVPlus.
              </p>
            </div>
          </div>

          {/* Bandeau visuel */}
          <div className="relative bg-gradient-to-br from-sky-500/20 via-sky-300/10 to-indigo-500/20 border-t md:border-t-0 md:border-l border-sky-700/50">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_20%,#0ea5e9,transparent_55%),radial-gradient(circle_at_80%_0%,#38bdf8,transparent_55%),radial-gradient(circle_at_50%_100%,#6366f1,transparent_55%)]" />
            <div className="relative h-full flex flex-col items-center justify-center p-6 sm:p-8 gap-4">
              <div className="flex items-center gap-3 bg-black/40 border border-sky-500/40 px-4 py-3 rounded-2xl backdrop-blur">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sky-100">
                    Paiement sécurisé Stripe
                  </p>
                  <p className="text-[11px] text-sky-100/80">
                    Chiffrement de bout en bout, normes PCI-DSS.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-3xl font-extrabold text-white tracking-wide">
                  + de 99.9%
                </p>
                <p className="text-xs text-sky-100/80">
                  Disponibilité visée grâce à de meilleures infrastructures.
                </p>
              </div>

              <p className="text-[11px] sm:text-xs text-sky-100/70 text-center max-w-xs">
                Stripe est un leader mondial du paiement en ligne. Vos données
                ne transitent jamais par nos serveurs et sont traitées
                directement par Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
