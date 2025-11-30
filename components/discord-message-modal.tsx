'use client'

import { useState } from 'react'
import { MessageCircle, Send, X, Image, Paperclip, AlertCircle, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface DiscordMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DiscordMessageModal({ isOpen, onClose }: DiscordMessageModalProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier la taille (max 8MB pour Discord)
      if (file.size > 8 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 8MB')
        return
      }
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image')
        return
      }
      
      setImageFile(file)
      
      // Créer un aperçu
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() && !imageFile) {
      setError('Veuillez écrire un message ou ajouter une image')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('content', message)
      
      if (imageFile) {
        formData.append('image', imageFile)
      }

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
        setSuccess(true)
        setMessage('')
        setImageFile(null)
        setImagePreview(null)
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 2000)
      } else {
        setError('Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      setError('Erreur lors de l\'envoi du message')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-10 fade-in-0 duration-300 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-500 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Support ZTVPlus</h3>
                  <p className="text-white/80 text-sm">Signaler un problème ou poser une question</p>
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

        {/* User info */}
        {session?.user ? (
          <div className="px-6 py-4 bg-gray-800/30 border-b border-white/10">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Avatar'}
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {session.user.name || 'Utilisateur'}
                </p>
                <p className="text-gray-400 text-xs">Connecté via Discord</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 bg-gray-800/30 border-b border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-gray-400" />
              </div>
              <h4 className="text-white font-semibold text-lg mb-2">Connexion requise</h4>
              <p className="text-gray-400 text-sm mb-6">
                Vous devez être connecté via Discord pour envoyer un message au support.
              </p>
              <Link
                href="/auth/discord"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
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
                <p className="text-green-400 font-semibold text-lg">Message envoyé !</p>
                <p className="text-gray-400 text-sm mt-2">Notre équipe vous répondra rapidement</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image preview */}
                {imagePreview && (
                  <div className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={imagePreview}
                      alt="Aperçu de l'image"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-all hover:scale-105"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <p className="text-white text-xs">
                        {imageFile?.name} ({imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : '0'}MB)
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre problème ou posez votre question..."
                    className="w-full h-36 bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-white/20 transition-all"
                    maxLength={1000}
                  />
                  <div className="text-right mt-2">
                    <span className="text-gray-400 text-xs">{message.length}/1000</span>
                  </div>
                </div>

                {/* Image upload */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white px-4 py-2 rounded-xl cursor-pointer transition-all border border-white/10 hover:border-white/20">
                    <Paperclip size={16} />
                    <span className="text-sm font-medium">Joindre une image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <span className="text-gray-400 text-xs bg-gray-800/50 px-3 py-1 rounded-lg">
                      Image sélectionnée
                    </span>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (!message.trim() && !imageFile)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Envoyer au support
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
