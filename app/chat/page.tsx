'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, RefreshCw, Users, Hash, Heart, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Film, ArrowLeft, Camera, Mic } from 'lucide-react'
import Link from 'next/link'

interface DiscordMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
  timestamp: string
  attachments: Array<{
    id: string
    filename: string
    size: number
    url: string
    contentType?: string
    isImage: boolean
  }>
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<DiscordMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      // Ajouter un timestamp pour éviter le cache
      const timestamp = Date.now()
      const response = await fetch(`/api/discord/chat-messages?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()

      if (response.ok) {
        console.log(`Received ${data.messages?.length || 0} messages from API`)
        setMessages(data.messages || [])
        setError('')
      } else {
        setError(data.error || 'Erreur lors de la récupération des messages')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchMessages, 5000)
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 0.1) return 'à l\'instant'
    if (diffInHours < 1) return `il y a ${Math.floor(diffInHours * 60)} min`
    if (diffInHours < 24) return `il y a ${Math.floor(diffInHours)} h`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isOwnMessage = (message: DiscordMessage) => {
    // Si pas de session, impossible être notre message
    if (!session?.user?.name) return false
    
    // Générer les deux formats possibles que le bot utilise
    const userTag = `@${session.user.name.toLowerCase().replace(/\s+/g, '_')}`
    const userBold = `**${session.user.name}**`
    
    // Vérifier si le message commence par notre tag utilisateur exact (@username)
    const startsWithUserTag = message.content?.startsWith(userTag)
    
    // Vérifier si le message commence par notre nom en gras (**username**)
    const startsWithUserBold = message.content?.startsWith(userBold)
    
    // Vérifier si l'auteur est le bot (messages envoyés via bot)
    const isFromBot = message.author.username === 'tChatter' || 
                     message.author.id === '1201229706603798619' ||
                     message.author.username.includes('Bot')
    
    // Si c'est du bot et que ça commence par notre tag ou nom, c'est notre message
    if (isFromBot && (startsWithUserTag || startsWithUserBold)) {
      console.log(`Detected own message: ${userTag}/${userBold} - ${message.content?.substring(0, 30)}...`)
      return true
    }
    
    // Vérification classique : si l'ID Discord correspond exactement
    if (session.user.id && session.user.id === message.author.id) {
      console.log(`Detected own message by ID: ${session.user.id}`)
      return true
    }
    
    return false
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 8MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image')
        return
      }
      
      setSelectedImage(file)
      setError('')
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return
    
    try {
      const formData = new FormData()
      formData.append('content', newMessage)
      formData.append('userName', session?.user?.name || 'Utilisateur')
      formData.append('userAvatar', session?.user?.image || '')
      formData.append('userId', session?.user?.id || '')
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      }
      
      const response = await fetch('/api/discord/chat', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        setNewMessage('')
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        fetchMessages()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-700 border-t-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col border-l border-gray-800">
      {/* Header Instagram DM Style - Fixed Top */}
      <div className="bg-black border-b-2 border-gray-700 px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/image.png" alt="Image" className="w-32 h-10 object-contain" />
              <span className="text-gray-400 font-bold text-lg">×</span>
              <img src="/tchatter-logo.png" alt="TChatter" className="w-32 h-10 object-contain" />
              <div>
                <p className="font-semibold text-lg">DISCORD - ZTVPLUS</p>
                <p className="text-green-400 text-xs">En ligne</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-full transition-colors ${
                autoRefresh 
                  ? 'text-green-400 hover:bg-green-900/20' 
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <RefreshCw size={20} className={autoRefresh ? 'animate-spin' : ''} />
            </button>
            <button className="text-gray-400 hover:bg-gray-800 p-2 rounded-full transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-black">
        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 m-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun message trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Soyez le premier à envoyer un message !</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => {
              const ownMessage = isOwnMessage(message)
              // Si c'est notre message envoyé via le bot, utiliser nos infos utilisateur
              const displayAuthor = ownMessage ? {
                displayName: session?.user?.name || 'Moi',
                username: session?.user?.name?.toLowerCase().replace(/\s+/g, '_') || 'moi',
                avatar: session?.user?.image || `https://cdn.discordapp.com/embed/avatars/0.png`
              } : message.author

              return (
                <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${ownMessage ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[70%]`}>
                    {/* Avatar */}
                    {!ownMessage && (
                      <img
                        src={displayAuthor.avatar}
                        alt={displayAuthor.displayName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`${ownMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Username for others */}
                      {!ownMessage && (
                        <p className="text-xs font-semibold text-gray-400 mb-1">{displayAuthor.displayName}</p>
                      )}
                      
                      {/* Message Content */}
                      <div className={`rounded-2xl px-4 py-2 ${
                        ownMessage 
                          ? 'bg-sky-500 text-white' 
                          : 'bg-gray-800 text-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {ownMessage ? 
                            // Si c'est notre message via bot, enlever le @username ou **username** du début proprement
                            (() => {
                              const userTag = `@${session?.user?.name?.toLowerCase().replace(/\s+/g, '_') || ''}`
                              const userBold = `\\*\\*${session?.user?.name || ''}\\*\\*`
                              
                              let cleanContent = message.content
                              
                              // Enlever le @username format
                              cleanContent = cleanContent.replace(new RegExp(`^${userTag}\\s*`, 'm'), '').trim()
                              
                              // Enlever le **username** format (astérisques échappées)
                              cleanContent = cleanContent.replace(new RegExp(`^${userBold}\\s*`, 'm'), '').trim()
                              
                              console.log(`Cleaned content: "${cleanContent}"`)
                              return cleanContent || message.content
                            })() :
                            message.content
                          }
                        </p>
                      </div>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className={`mt-1 space-y-1 ${ownMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className={`rounded-lg overflow-hidden max-w-sm ${
                              ownMessage ? 'bg-sky-900/50' : 'bg-gray-800 border border-gray-700'
                            }`}>
                              {attachment.isImage ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.filename}
                                  className="w-full max-h-48 object-cover"
                                />
                              ) : (
                                <div className="p-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle size={16} className={ownMessage ? 'text-sky-400' : 'text-gray-500'} />
                                    <span className="text-xs font-medium truncate text-gray-200">{attachment.filename}</span>
                                    <span className="text-xs text-gray-400">{formatFileSize(attachment.size)}</span>
                                  </div>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs font-medium mt-1 inline-block ${
                                      ownMessage ? 'text-sky-400' : 'text-sky-500'
                                    } hover:underline`}
                                  >
                                    Télécharger
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <p className={`text-xs mt-1 ${ownMessage ? 'text-gray-500 text-right' : 'text-gray-400'}`}>
                        {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="bg-black border-t border-gray-800 p-2 shadow-md">
          <div className="flex items-center gap-2">
            <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-gray-800" />
            <span className="text-sm text-gray-300 truncate flex-1">{selectedImage?.name}</span>
            <button
              onClick={() => {
                setSelectedImage(null)
                setImagePreview(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Message Input Area - Fixed Bottom */}
      <div className="bg-black border-t-2 border-gray-700 p-4 sticky bottom-0 z-30 shadow-lg">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <Camera size={24} />
          </button>
          
          <div className="flex-1 bg-gray-800 rounded-full px-4 py-2 flex items-center border border-gray-700">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Envoyer un message..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !selectedImage}
            className={`p-2 rounded-lg transition-colors ${
              (newMessage.trim() || selectedImage)
                ? 'text-sky-400 hover:text-sky-300 hover:bg-gray-800' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Fixed Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="p-2 text-gray-400 hover:text-white transition-colors">
            <Home size={24} />
          </Link>
          <Link href="/search" className="p-2 text-gray-400 hover:text-white transition-colors">
            <Search size={24} />
          </Link>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <PlusSquare size={24} />
          </button>
          <Link href="/chat" className="p-2 text-sky-400">
            <Film size={24} />
          </Link>
          <div className="p-2">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <Users size={24} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
