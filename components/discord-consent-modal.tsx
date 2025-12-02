'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, X, Check, Shield, Users } from 'lucide-react'

interface DiscordConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function DiscordConsentModal({ isOpen, onClose, onAccept }: DiscordConsentModalProps) {
  const [hasConsented, setHasConsented] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [isMemberVerified, setIsMemberVerified] = useState<boolean | null>(null)

  // Vérifier si le consentement a déjà été donné
  useEffect(() => {
    const consent = localStorage.getItem('discord_consent')
    if (consent === 'true') {
      setHasConsented(true)
      setIsChecked(true) // Pré-cocher si déjà consenti
    }
  }, [])

  const checkDiscordMembership = useCallback(async () => {
    setVerificationError(null)
    setIsMemberVerified(null)
    setIsVerifying(true)

    try {
      const response = await fetch('/api/discord/verify-membership', {
        cache: 'no-store',
        credentials: 'include',
      })
      let payload: { isMember?: boolean; error?: string } = {}

      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok) {
        setIsMemberVerified(false)
        setVerificationError(payload?.error || 'Impossible de vérifier votre adhésion.')
        return false
    }

    if (!payload?.isMember) {
      setIsMemberVerified(false)
      setVerificationError('Rejoignez le serveur Discord officiel pour continuer.')
      return false
    }

    setIsMemberVerified(true)
    return true
  } catch (error) {
    console.error(error)
    setIsMemberVerified(false)
    setVerificationError('La vérification a échoué. Réessayez dans un instant.')
    return false
  } finally {
    setIsVerifying(false)
  }
  }, [])

  const handleAccept = async () => {
    if (!isChecked || isVerifying) return

    const membershipValid = await checkDiscordMembership()
    if (!membershipValid) return

    localStorage.setItem('discord_consent', 'true')
    setHasConsented(true)
    onAccept()
  }

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked)
    if (verificationError) {
      setVerificationError(null)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const verifyOnOpen = async () => {
      const membershipValid = await checkDiscordMembership()
      if (!membershipValid && !cancelled) {
        onClose()
      }
    }

    verifyOnOpen()

    return () => {
      cancelled = true
    }
  }, [isOpen, onClose, checkDiscordMembership])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-black border border-orange-500/30 rounded-2xl shadow-2xl shadow-orange-500/20 w-full max-w-md animate-in slide-in-from-bottom-10 fade-in-0 duration-300 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-600/20 to-red-500/20 p-6 border-b border-orange-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-500/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-orange-400/40">
                  <AlertTriangle size={20} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Conditions requises</h3>
                  <p className="text-orange-300 text-sm">Serveur Discord obligatoire</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-orange-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-orange-500/30 transition-colors border border-orange-400/40"
              >
                <X size={18} className="text-orange-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Alert message */}
            <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-orange-400 font-semibold text-sm mb-2">
                    Important : Serveur Discord requis
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Pour que votre demande soit acceptée, vous devez être membre du serveur Discord officiel. 
                    Les demandes des utilisateurs non-membres seront automatiquement refusées.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-400/40">
                  <Check size={16} className="text-green-400" />
                </div>
                <p className="text-gray-300 text-sm">
                  Accès prioritaire aux nouvelles demandes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-400/40">
                  <Check size={16} className="text-green-400" />
                </div>
                <p className="text-gray-300 text-sm">
                  Suivi direct de vos demandes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-400/40">
                  <Check size={16} className="text-green-400" />
                </div>
                <p className="text-gray-300 text-sm">
                  Notifications des mises à jour
                </p>
              </div>
            </div>

            {/* Server info */}
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-blue-400" />
                <div className="flex-1">
                  <p className="text-blue-400 font-medium text-sm">Serveur Discord officiel</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Rejoignez notre communauté pour profiter de tous les avantages
                  </p>
                  <a
                    href="https://discord.com/invite/WjedsPDts3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors border border-blue-500/50"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.076 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Rejoindre le serveur
                  </a>
                  <button
                    onClick={checkDiscordMembership}
                    disabled={isVerifying}
                    className="inline-flex items-center justify-center gap-2 mt-3 w-full rounded-lg border border-blue-500/50 bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {isVerifying ? 'Vérification...' : 'Vérifier mon adhésion'}
                  </button>
                  {isMemberVerified && !verificationError && (
                    <p className="text-emerald-400 text-xs mt-2">
                      Vous êtes membre du serveur Discord.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Limitation info */}
            <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-yellow-400" />
                <p className="text-yellow-400 text-xs">
                  Limitation : 1 demande par heure pour éviter les abus
                </p>
              </div>
            </div>

            {/* Checkbox consent */}
            <div className="bg-black/50 border border-gray-600/30 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-black border-orange-500/30 rounded focus:ring-2 focus:ring-orange-500/50 text-orange-500 focus:border-orange-400"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    Oui, j'ai pris conscience
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Je comprends que je dois être membre du serveur Discord pour que ma demande soit traitée
                  </p>
                </div>
              </label>
            </div>

            {verificationError && (
              <p className="text-red-400 text-xs mt-1">
                {verificationError}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-gray-600/50"
              >
                Annuler
              </button>
              <button
                onClick={handleAccept}
                disabled={!isChecked || isVerifying}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2 shadow-lg border border-orange-500/30"
              >
                <Check size={18} />
                {isVerifying ? 'Vérification...' : 'Continuer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
