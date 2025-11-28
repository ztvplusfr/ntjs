'use client'

import { useState } from 'react'
import { MessageCircle, Send, X, Image, Paperclip, HeadphonesIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
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
      // Vérifier la taille (max 8MB)
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4 lg:p-8">
      {/* Mobile: modale en bas avec coins arrondis */}
      <div className="w-full bg-gray-900 border border-gray-700 rounded-t-3xl lg:rounded-lg shadow-2xl lg:max-w-2xl lg:max-h-[90vh] lg:h-auto lg:mx-auto animate-in slide-in-from-bottom-5 fade-in-0 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sky-500 rounded-lg flex items-center justify-center">
              <HeadphonesIcon size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Support ZTVPlus</h3>
              <p className="text-gray-400 text-sm">Comment pouvons-nous vous aider ?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} className="lg:hidden" />
            <X size={24} className="hidden lg:block" />
          </button>
        </div>

        {/* User info */}
        {session?.user && (
          <div className="px-4 lg:px-6 py-3 bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Avatar'}
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {session.user.name || 'Utilisateur'}
                </p>
                <p className="text-gray-400 text-xs">Connecté via Discord</p>
              </div>
            </div>
          </div>
        )}

        {/* Content - scrollable avec hauteur limitée */}
        <div className="max-h-[60vh] lg:max-h-[50vh] overflow-y-auto p-4 lg:p-6">
          {success ? (
            <div className="text-center py-8 lg:py-12">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-500 lg:hidden" />
                <Send size={32} className="text-green-500 hidden lg:block" />
              </div>
              <p className="text-green-400 font-medium text-lg">Message envoyé avec succès !</p>
              <p className="text-gray-400 text-sm mt-2">Vous serez redirigé dans 2 secondes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              {/* Image preview */}
              {imagePreview && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Aperçu de l'image"
                    className="w-full h-32 lg:h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 lg:p-2 rounded-full transition-colors"
                  >
                    <X size={16} className="lg:hidden" />
                    <X size={20} className="hidden lg:block" />
                  </button>
                </div>
              )}

              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou votre question..."
                  className="w-full h-32 lg:h-48 bg-gray-800 border border-gray-700 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm lg:text-base"
                  maxLength={1000}
                />
                <div className="text-right mt-1">
                  <span className="text-gray-400 text-xs lg:text-sm">{message.length}/1000</span>
                </div>
              </div>

              {/* Image upload */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg cursor-pointer transition-colors justify-center">
                  <Paperclip size={16} className="lg:hidden" />
                  <Paperclip size={20} className="hidden lg:block" />
                  <span className="text-sm lg:text-base">Joindre une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imageFile && (
                  <span className="text-gray-400 text-xs lg:text-sm text-center lg:text-left">
                    {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 lg:p-4">
                  <p className="text-red-400 text-sm lg:text-base">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !imageFile)}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 lg:py-4 px-4 lg:px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} className="lg:hidden" />
                    <Send size={20} className="hidden lg:block" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
