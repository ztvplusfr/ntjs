'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import DiscordMessageModal from '@/components/discord-message-modal'

interface WatchMovieClientProps {
  children: React.ReactNode
}

export default function WatchMovieClient({ children }: WatchMovieClientProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  return (
    <>
      {children}
      
      {/* Modale de support Discord */}
      <DiscordMessageModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  )
}
