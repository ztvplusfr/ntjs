'use client'

import { MessageCircle, X } from 'lucide-react'
import Link from 'next/link'

interface DiscordMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DiscordMessageModal({ isOpen, onClose }: DiscordMessageModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-10 fade-in-0 duration-300 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-500 p-6">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Support Discord ZTVPlus</h3>
                  <p className="text-white/80 text-sm">
                    Signaler un problème sur notre serveur Discord
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-200">
              Pour signaler un problème ou demander de l&apos;aide, merci de passer par notre
              salon dédié sur Discord.
            </p>
            <p className="text-gray-400 text-sm">
              Cliquez sur le bouton ci-dessous pour ouvrir le salon de support. Une fois sur
              Discord, décrivez votre problème le plus précisément possible (série/épisode,
              appareil, capture d&apos;écran, etc.).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-4">
              <Link
                href="https://discord.com/channels/1345784902452248596/1443239324916121782"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors w-full sm:w-auto"
              >
                <MessageCircle size={18} />
                <span>Ouvrir le salon Discord support</span>
              </Link>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-white/20 text-gray-200 hover:bg-white/5 text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

