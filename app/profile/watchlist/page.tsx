'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookmarkPlus } from 'lucide-react'

interface WatchlistEntry {
  tmdb_id: number
  content_type: 'movie' | 'series'
  title?: string
  poster?: string
  backdrop?: string
  media_type?: string
  release_date?: string
  overview?: string
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<WatchlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ item: WatchlistEntry; x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/api/auth/discord")
      return
    }
    if (authLoading) return
    if (!user) return

    const controller = new AbortController()

    const fetchWatchlist = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/watchlist', {
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('Impossible de charger la watchlist')
        }

        const data = await response.json()
        const payload = data.details || data.list || []
        setItems(payload)
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        console.error(err)
        setError('Erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWatchlist()

    return () => controller.abort()
  }, [user, authLoading])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/api/auth/discord")
      return
    }
    if (!contextMenu) return
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setContextMenu(null)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu])

  const handleDelete = async (entry: WatchlistEntry) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: entry.tmdb_id,
          contentType: entry.content_type
        })
      })
      if (!response.ok) {
        throw new Error('Erreur suppression')
      }
      setItems((prev) =>
        prev.filter((item) => !(item.tmdb_id === entry.tmdb_id && item.content_type === entry.content_type))
      )
      setContextMenu(null)
    } catch (err) {
      console.error('Erreur suppression watchlist:', err)
      setError('Impossible de supprimer cet élément')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <p>Connecte-toi pour voir ta watchlist</p>
        <Link href="/auth/signin" className="px-4 py-2 bg-sky-600 text-white rounded-lg">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <BookmarkPlus className="h-4 w-4 text-amber-400" />
          <span>Ta watchlist</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Contenus enregistrés</h1>

        {error && (
          <div className="px-4 py-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-300">
            <p>Ta watchlist est vide.</p>
            <p className="text-xs text-gray-500 mt-1">
              Ajoute des films ou séries depuis le hero ou les fiches content.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const slug = `${item.tmdb_id}-${(item.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
              const href =
                item.content_type === 'series'
                  ? `/series/${slug}`
                  : `/movies/${slug}`
              return (
                <Link
                  key={`${item.tmdb_id}-${item.content_type}`}
                  href={href}
                  className="group block rounded-2xl border border-white/10 bg-gray-900/60 transition hover:border-white/30"
                  onContextMenu={(event) => {
                    event.preventDefault()
                    setContextMenu({
                      item,
                      x: event.clientX,
                      y: event.clientY
                    })
                  }}
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-gray-800">
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt={item.title || 'Contenu'}
                        fill
                        priority
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 120px, 180px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-500">
                        {item.content_type === 'series' ? 'SÉRIE' : 'FILM'}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold line-clamp-2">{item.title || 'Titre inconnu'}</p>
                    {item.overview && (
                      <p className="text-[11px] text-gray-400 line-clamp-3">
                        {item.overview}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-500">
                      <span>{item.content_type === 'series' ? 'Série' : 'Film'}</span>
                      <span>{item.release_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        {contextMenu && (
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              transform: 'translate(-50%, -10px)',
              zIndex: 50
            }}
            className="rounded-2xl border border-white/20 bg-neutral-900/90 p-3 text-sm shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={() => handleDelete(contextMenu.item)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10"
            >
              <span>Supprimer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const slug = `${contextMenu.item.tmdb_id}-${(contextMenu.item.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
                const href =
                  contextMenu.item.content_type === 'series'
                    ? `/series/${slug}`
                    : `/movies/${slug}`
                window.location.href = href
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10"
            >
              <span>Voir le détail</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
