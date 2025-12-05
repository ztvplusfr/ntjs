'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Film, Tv, XCircle, Play } from 'lucide-react'

interface HistoryEntry {
  content_id: number
  content_type: 'movie' | 'series'
  title?: string
  poster?: string
  backdrop?: string
  last_watched_at?: string
  season?: number
  episode?: number
  video_id?: string
}

export default function ProfileHistoryPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ item: HistoryEntry; x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) return

    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/history', {
          signal: controller.signal,
          cache: 'no-store'
        })
        if (!response.ok) {
          throw new Error('Impossible de charger l\'historique')
        }
        const payload = await response.json()
        setItems(payload.history || [])
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        console.error(err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [session, status])

  useEffect(() => {
    if (!contextMenu) return
    const handle = (event: MouseEvent | TouchEvent | KeyboardEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      if ((event as KeyboardEvent).key === 'Escape' || !(event as KeyboardEvent).key) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
      document.removeEventListener('keydown', handle)
    }
  }, [contextMenu])

  const handleDelete = async (entry: HistoryEntry) => {
    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: entry.content_id,
          content_type: entry.content_type,
          season: entry.season,
          episode: entry.episode
        })
      })
      if (!response.ok) throw new Error('Erreur')
      setItems((prev) => prev.filter(
        (item) =>
          !(
            item.content_id === entry.content_id &&
            item.content_type === entry.content_type &&
            item.season === entry.season &&
            item.episode === entry.episode
          )
      ))
      setContextMenu(null)
    } catch (err) {
      console.error(err)
      setError('Impossible de supprimer')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-sky-500"></div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <p>Connecte-toi pour voir ton historique</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.4em] text-gray-400 mb-6">
          <Clock className="h-4 w-4 text-sky-400" />
          <span>Historique</span>
        </div>
        <div className="space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-gray-300 text-center">
              <p>Ton historique est vide.</p>
            </div>
          ) : (
            Object.entries(
              items
                .slice()
                .sort((a, b) => {
                  const aDate = new Date(a.last_watched_at || 0).getTime()
                  const bDate = new Date(b.last_watched_at || 0).getTime()
                  return bDate - aDate
                })
                .reduce((acc, item) => {
                  const label = item.last_watched_at
                    ? new Date(item.last_watched_at).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Date inconnue'
                  if (!acc[label]) acc[label] = []
                  acc[label].push(item)
                  return acc
                }, {} as Record<string, HistoryEntry[]>)
            ).map(([dateLabel, entries]) => (
              <div key={dateLabel} className="space-y-4">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
                  {dateLabel}
                </div>
                <div className="space-y-3">
                  {entries.map((item) => {
                    const watchHref =
                      item.content_type === 'series'
                        ? `/watch/series/${item.content_id}/${item.season ?? 1}/${item.episode ?? 1}`
                        : `/watch/${item.content_id}`
                    return (
                      <Link
                        key={`${item.content_id}-${item.content_type}-${item.season ?? 0}-${item.episode ?? 0}`}
                        href={watchHref}
                        className="group flex flex-col rounded-2xl border border-white/10 bg-gray-900/60 p-3 transition hover:border-white/40"
                        onContextMenu={(event) => {
                          event.preventDefault()
                          setContextMenu({
                            item,
                            x: event.clientX,
                            y: event.clientY
                          })
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-20 w-12 overflow-hidden rounded-lg bg-gray-800">
                            {item.poster ? (
                              <Image
                                src={item.poster}
                                alt={item.title || 'Contenu'}
                                fill
                                className="object-cover"
                                sizes="60px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.3em] text-gray-500">
                                {item.content_type === 'series' ? 'sér' : 'film'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1">
                            <p className="text-sm font-semibold">{item.title || 'Titre inconnu'}</p>
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                              {item.content_type === 'series' ? 'Série' : 'Film'}
                              {item.season ? ` • S${String(item.season).padStart(2, '0')}` : ''}
                              {item.episode ? `E${String(item.episode).padStart(2, '0')}` : ''}
                            </p>
                            {item.last_watched_at && (
                              <p className="text-[11px] text-gray-400">
                                Vu le {new Date(item.last_watched_at).toLocaleDateString('fr-FR')} à{' '}
                                {new Date(item.last_watched_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              setContextMenu({
                                item,
                                x: event.clientX,
                                y: event.clientY
                              })
                            }}
                            className="rounded-full border border-white/20 px-3 py-1 text-xs text-gray-200"
                          >
                            Actions
                          </button>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        {contextMenu && (
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 50,
              minWidth: 180,
              transform: 'translate(-50%, -10px)'
            }}
            className="rounded-2xl border border-white/20 bg-neutral-900/90 p-3 text-sm shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={() => handleDelete(contextMenu.item)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10"
            >
              <XCircle className="h-4 w-4" />
              Supprimer de l'historique
            </button>
            <button
              type="button"
              onClick={() => {
                const watchHref =
                  contextMenu.item.content_type === 'series'
                    ? `/watch/series/${contextMenu.item.content_id}/${contextMenu.item.season ?? 1}/${contextMenu.item.episode ?? 1}`
                    : `/watch/${contextMenu.item.content_id}`
                window.location.href = watchHref
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-white transition hover:bg-white/10"
            >
              <Play className="h-4 w-4" />
              Continuer la lecture
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
