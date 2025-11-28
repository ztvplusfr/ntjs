'use client'

import { useState, useEffect } from 'react'
import { IconEye } from '@tabler/icons-react'

interface ViewCounterProps {
  id: string
  type: 'movie' | 'series'
  className?: string
}

export default function ViewCounter({ id, type, className = '' }: ViewCounterProps) {
  const [views, setViews] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const incrementView = async () => {
      try {
        // Appeler l'API pour incrémenter les vues
        const response = await fetch('/api/views/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            type,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setViews(data.views)
        }
      } catch (error) {
        console.error('Error incrementing views:', error)
      } finally {
        setIsLoading(false)
      }
    }

    incrementView()
  }, [id, type])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <IconEye size={16} className="animate-pulse" />
        <span className="text-sm">...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
      <IconEye size={16} />
      <span className="text-sm">{views.toLocaleString('fr-FR')} vues</span>
    </div>
  )
}
