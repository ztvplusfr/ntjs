'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function MovieDonationPrompt() {
  return (
    <section className="my-10 px-4 sm:px-6 lg:px-0">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-sky-900/60 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.6)] backdrop-blur">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <h3 className="text-lg font-semibold text-white">
            Un petit don pour conserver le film gratuit
          </h3>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          ZTVPlus restera toujours gratuit, mais l&apos;hébergement, les serveurs et
          le streaming coûtent cher. Chaque contribution permet de garder cette page
          disponible avec un streaming fluide et sans publicité invasive.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="https://buy.stripe.com/7sY9AU9eo4CzbBr5oS2cg00"
            target="_blank"
            rel="noreferrer"
            prefetch={false}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Faire un don sécurisé
          </Link>
          <p className="text-[11px] text-slate-400">
            Stripe gère directement vos paiements pour davantage de sécurité.
          </p>
        </div>
      </div>
    </section>
  )
}
