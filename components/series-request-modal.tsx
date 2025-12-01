'use client'

import { useState, useEffect } from 'react'
import { Send, X, AlertCircle, CheckCircle, Tv, Clock, AlertTriangle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import DiscordConsentModal from './discord-consent-modal'

interface SeriesRequestModalProps {
  isOpen: boolean
  onClose: () => void
  seriesTitle: string
  seriesId: number
}

export default function SeriesRequestModal({ isOpen, onClose, seriesTitle, seriesId }: SeriesRequestModalProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [canSubmit, setCanSubmit] = useState(true)
  const [nextSubmissionTime, setNextSubmissionTime] = useState<Date | null>(null)

  // Vérifier si l'utilisateur peut soumettre une demande pour cette série
  useEffect(() => {
    if (!session?.user?.id) return

    const checkSubmissionLimit = () => {
      const lastSubmission = localStorage.getItem(`series_request_${session.user.id}_${seriesId}`)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      if (lastSubmission) {
        const lastTime = new Date(lastSubmission)
        if (lastTime > oneHourAgo) {
          setCanSubmit(false)
          setNextSubmissionTime(new Date(lastTime.getTime() + 60 * 60 * 1000))
        } else {
          setCanSubmit(true)
          setNextSubmissionTime(null)
        }
      } else {
        setCanSubmit(true)
        setNextSubmissionTime(null)
      }
    }

    checkSubmissionLimit()
    const interval = setInterval(checkSubmissionLimit, 1000) // Vérifier chaque seconde

    return () => clearInterval(interval)
  }, [session?.user?.id, seriesId])

  // Vérifier le consentement Discord à l'ouverture (toujours afficher)
  useEffect(() => {
    if (isOpen && session?.user) {
      setShowConsentModal(true)
    }
  }, [isOpen, session])

  // Pré-remplir le message avec les informations de la série
  useEffect(() => {
    if (isOpen && seriesTitle) {
      setMessage(`Bonjour, je souhaite demander l'ajout de la série "${seriesTitle}" (ID: ${seriesId}) sur la plateforme. Pourriez-vous rendre les vidéos disponibles ? Merci !`)
    }
  }, [isOpen, seriesTitle, seriesId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setError('Veuillez écrire un message')
      return
    }

    if (!canSubmit) {
      setError('Veuillez attendre avant de faire une nouvelle demande pour cette série')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('content', message)
      formData.append('type', 'series_request')
      formData.append('seriesId', seriesId.toString())
      formData.append('seriesTitle', seriesTitle)

      // Ajouter les infos utilisateur
      if (session?.user) {
        formData.append('userName', session.user.name || 'Utilisateur anonyme')
        formData.append('userAvatar', session.user.image || '')
        formData.append('userId', session.user.id || '')
      }

      const response = await fetch('/api/discord/message', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Enregistrer la demande pour cette série
        if (session?.user?.id) {
          localStorage.setItem(`series_request_${session.user.id}_${seriesId}`, new Date().toISOString())
        }
        
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 3000)
      } else {
        const errorData = await response.json()
        if (response.status === 429) {
          setError('Veuillez attendre avant de faire une nouvelle demande pour cette série')
        } else if (response.status === 403) {
          setError('Vous devez être membre du serveur Discord pour faire une demande.')
        } else {
          setError('Erreur lors de l\'envoi de la demande')
        }
      }
    } catch (error) {
      setError('Erreur lors de l\'envoi de la demande')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsentAccept = () => {
    setShowConsentModal(false)
  }

  const handleConsentClose = () => {
    setShowConsentModal(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal de consentement Discord */}
      <DiscordConsentModal
        isOpen={showConsentModal}
        onClose={handleConsentClose}
        onAccept={handleConsentAccept}
      />

      {/* Modal de demande principale */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-black border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-lg animate-in slide-in-from-bottom-10 fade-in-0 duration-300 overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-r from-cyan-600/20 to-blue-500/20 p-6 border-b border-cyan-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-500/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-cyan-400/40">
                    <Tv size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Demander cette série</h3>
                    <p className="text-cyan-300 text-sm">Faire une demande d'ajout</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-cyan-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-cyan-500/30 transition-colors border border-cyan-400/40"
                >
                  <X size={18} className="text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Series info */}
          <div className="px-6 py-4 bg-cyan-950/20 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-400/40">
                <Tv size={20} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{seriesTitle}</p>
                <p className="text-cyan-400 text-xs">ID TMDB: {seriesId}</p>
              </div>
            </div>
          </div>

          {/* User info or login prompt */}
          {session?.user ? (
            <>
              <div className="px-6 py-3 bg-cyan-950/10 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Avatar'}
                      className="w-8 h-8 rounded-full border-2 border-cyan-400/40"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-400/40">
                      <Tv size={16} className="text-cyan-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {session.user.name || 'Utilisateur'}
                    </p>
                    <p className="text-cyan-400 text-xs">Demande envoyée par @{session.user.name || 'utilisateur'}</p>
                  </div>
                </div>
              </div>

              {/* Limitation warning */}
              {!canSubmit && nextSubmissionTime && (
                <div className="px-6 py-3 bg-yellow-950/20 border-b border-yellow-500/20">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    <p className="text-yellow-400 text-xs">
                      Prochaine demande possible à {nextSubmissionTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-6 bg-gray-800/30 border-b border-white/10">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tv size={32} className="text-gray-400" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Connexion requise</h4>
                <p className="text-gray-400 text-sm mb-6">
                  Vous devez être connecté via Discord pour faire une demande de série.
                </p>
                <Link
                  href="/auth/discord"
                  className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-xl transition-colors border border-cyan-500/50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Se connecter avec Discord
                </Link>
              </div>
            </div>
          )}

          {/* Content */}
          {session?.user && (
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <p className="text-green-400 font-semibold text-lg">Demande envoyée !</p>
                  <p className="text-gray-400 text-sm mt-2">Nous traiterons votre demande dès que possible</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Message pour l'équipe
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre demande..."
                      className="w-full h-32 bg-black/50 border border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder-cyan-400/60 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all"
                      maxLength={500}
                    />
                    <div className="text-right mt-2">
                      <span className="text-cyan-400 text-xs">{message.length}/500</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-400 mt-0.5" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !message.trim() || !canSubmit}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-700 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2 shadow-lg border border-cyan-500/30"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {canSubmit ? 'Envoyer la demande' : 'Attendez...'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
