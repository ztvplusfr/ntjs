'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BookmarkPlus, Check, Loader2 } from 'lucide-react'

interface WatchlistButtonProps {
  tmdbId: number | string
  contentType: 'movie' | 'series'
  className?: string
  defaultState?: ButtonState
  onStateChange?: (state: ButtonState) => void
}

export type ButtonState = 'idle' | 'saving' | 'saved' | 'error'

export default function WatchlistButton({
  tmdbId,
  contentType,
  className,
  defaultState,
  onStateChange
}: WatchlistButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')

  useEffect(() => {
    setState(defaultState ?? 'idle')
  }, [defaultState])

  const handleToggleWatchlist = async () => {
    if (state === 'saving') return
    setState('saving')
    onStateChange?.('saving')

    try {
      const response = await fetch('/api/watchlist', {
        method: state === 'saved' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId,
          contentType
        })
      })

      if (!response.ok) {
        throw new Error('Erreur serveur')
      }

      const nextState: ButtonState = state === 'saved' ? 'idle' : 'saved'
      setState(nextState)
      onStateChange?.(nextState)
    } catch (error) {
      console.error('Watchlist error', error)
      setState('error')
      onStateChange?.('error')
    }
  }

  let label = 'Ajouter à la watchlist'
  let Icon = BookmarkPlus
  if (state === 'saving') {
    label = 'En cours...'
    Icon = Loader2
  } else if (state === 'saved') {
    label = 'Enregistré'
    Icon = Check
  } else if (state === 'error') {
    label = 'Erreur'
    Icon = AlertTriangle
  }

  return (
    <button
      type="button"
      aria-live="polite"
      onClick={handleToggleWatchlist}
      disabled={state === 'saving'}
      className={[
        'inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white/80 hover:bg-white/10 disabled:cursor-not-allowed',
        className || ''
      ].join(' ')}
    >
      <Icon className={`h-4 w-4 ${state === 'saving' ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </button>
  )
}
