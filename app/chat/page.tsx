'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { MessageCircle, Send, RefreshCw, Users, Hash, Heart, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Film, ArrowLeft, Camera, Mic } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Vous devez être connecté pour accéder au chat</p>
          <a href="/api/auth/discord" className="text-blue-400 hover:underline">Se connecter</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Chat</h1>
        <p>Chat en développement...</p>
      </div>
    </div>
  )
}
