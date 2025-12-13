'use client'

import Link from 'next/link'
import { HeartHandshake, ShieldCheck, CreditCard, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DonationCta() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-900/80 border-gray-800 text-white overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <HeartHandshake className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Soutenez ZTVPlus
                </h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  Vos dons nous permettent d&apos;améliorer nos serveurs et d&apos;offrir une meilleure qualité de streaming à toute la communauté.
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Via Stripe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Impact direct</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold px-6">
                  <Link href="https://buy.stripe.com/7sY9AU9eo4CzbBr5oS2cg00">
                    Faire un don
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
