'use client'

import { useState, useEffect } from 'react'
import { IconEye } from '@tabler/icons-react'

interface ViewCounterProps {
  id: string
  type: 'movie' | 'series'
  className?: string
}

// Fonction pour formater les nombres de manière lisible
function formatViews(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

export default function ViewCounter({ id, type, className = '' }: ViewCounterProps) {
  const [views, setViews] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasIncremented, setHasIncremented] = useState(false)

  useEffect(() => {
    const loadViews = async () => {
      try {
        // D'abord récupérer les vues actuelles sans incrémenter
        const getResponse = await fetch(`/api/views/get?id=${encodeURIComponent(id)}&type=${type}`)
        
        if (getResponse.ok) {
          const data = await getResponse.json()
          setViews(data.views)
        }

        // Ensuite incrémenter seulement une fois par session
        if (!hasIncremented) {
          const incrementResponse = await fetch('/api/views/increment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id,
              type,
            }),
          })

          if (incrementResponse.ok) {
            const incrementData = await incrementResponse.json()
            setViews(incrementData.views)
            setHasIncremented(true)
          }
        }
      } catch (error) {
        console.error('Error managing views:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadViews()
  }, [id, type, hasIncremented])

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
      <span className="text-sm">{formatViews(views)} vues</span>
    </div>
  )
}
