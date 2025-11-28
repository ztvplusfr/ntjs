'use client'

import { useState } from 'react'
import { MessageCircle, Send, X, Image, Paperclip } from 'lucide-react'
import { useSession } from 'next-auth/react'

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-end p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-5 fade-in-0 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Message Discord</h3>
              <p className="text-gray-400 text-sm">Support serveur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        {session?.user && (
          <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Avatar'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  Envoyé par {session.user.name || 'Utilisateur'}
                </p>
                <p className="text-gray-400 text-xs">Depuis ZTVPlus</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-500" />
              </div>
              <p className="text-green-400 font-medium">Message envoyé avec succès !</p>
              <p className="text-gray-400 text-sm mt-2">Vous serez redirigé dans 2 secondes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image preview */}
              {imagePreview && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Aperçu de l'image"
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={1000}
                />
                <div className="text-right mt-1">
                  <span className="text-gray-400 text-xs">{message.length}/1000</span>
                </div>
              </div>

              {/* Image upload */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <Paperclip size={16} />
                  <span className="text-sm">Joindre une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imageFile && (
                  <span className="text-gray-400 text-xs">
                    {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !imageFile)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} />
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
