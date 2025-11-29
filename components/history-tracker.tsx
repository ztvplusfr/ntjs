'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { cookieUtils, WatchHistoryItem } from '@/lib/cookies'

interface HistoryTrackerProps {
  type: 'movie' | 'series'
  movie?: {
    id: string
    title: string
    poster_path?: string
    backdrop_path?: string
  }
  series?: {
    id: string
    name: string
    poster_path?: string
    backdrop_path?: string
  }
  season?: number
  episode?: number
  episodeTitle?: string
  video?: {
    id: string
    hasAds: boolean
    lang: string
    pub: number
    quality: string
    server: string
    url: string
    serverIndex?: number
  }
}

interface HistoryItem {
  type: 'movie' | 'series'
  id: string
  title: string
  poster: string
  backdrop?: string
  timestamp: number
  date: string
  time: string
  season?: number
  episode?: number
  episodeTitle?: string
  video?: {
    id: string
    hasAds: boolean
    lang: string
    pub: number
    quality: string
    server: string
    url: string
    serverIndex?: number
  }
}

export default function HistoryTracker({ 
  type, 
  movie, 
  series, 
  season, 
  episode, 
  episodeTitle, 
  video 
}: HistoryTrackerProps) {
  const { data: session } = useSession()

  useEffect(() => {
    const sendHistoryToSupabase = async (payload: {
      contentId: string
      contentType: 'movie' | 'series'
      season?: number
      episode?: number
      metadata?: Record<string, unknown>
    }) => {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            progressSeconds: 0,
            durationSeconds: undefined
          })
        })
      } catch (error) {
        console.error('Erreur enregistrement historique Supabase:', error)
      }
    }

    // Ajouter à l'historique
    const addToHistory = (
      itemType: 'movie' | 'series',
      itemData: any,
      seasonData?: number,
      episodeData?: number,
      episodeTitleData?: string,
      videoData?: any
    ) => {
      const now = new Date()
      
      // Récupérer le backdrop depuis TMDB si nécessaire
      const fetchBackdropFromTMDB = async (id: string, type: 'movie' | 'series') => {
        try {
          // Utiliser le bon endpoint TMDB (tv pour les séries, movie pour les films)
          const tmdbType = type === 'series' ? 'tv' : 'movie'
          
          // Essayer d'abord en français
          const frResponse = await fetch(
            `https://api.themoviedb.org/3/${tmdbType}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR&append_to_response=images`,
            { cache: 'no-store' }
          )
          
          if (frResponse.ok) {
            const data = await frResponse.json()
            if (data.backdrop_path) {
              return `https://image.tmdb.org/t/p/w780${data.backdrop_path}`
            }
          }
          
          // Si pas en français, essayer en anglais
          const enResponse = await fetch(
            `https://api.themoviedb.org/3/${tmdbType}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US&append_to_response=images`,
            { cache: 'no-store' }
          )
          
          if (enResponse.ok) {
            const data = await enResponse.json()
            if (data.backdrop_path) {
              return `https://image.tmdb.org/t/p/w780${data.backdrop_path}`
            }
          }
        } catch (error) {
          console.error('Error fetching backdrop from TMDB:', error)
        }
        return undefined
      }
      
      const getPosterUrl = (posterPath: string | undefined) => {
        if (!posterPath) return '/placeholder-poster.jpg'
        return `https://image.tmdb.org/t/p/w500${posterPath}`
      }
      
      // Créer l'entrée d'historique
      const historyItem: HistoryItem = {
        type: itemType,
        id: itemData.id,
        title: itemType === 'series' ? itemData.name : itemData.title,
        poster: getPosterUrl(itemData.poster_path),
        backdrop: itemData.backdrop_path ? `https://image.tmdb.org/t/p/w780${itemData.backdrop_path}` : undefined,
        timestamp: now.getTime(),
        date: now.toLocaleDateString('fr-FR'),
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        season: seasonData,
        episode: episodeData,
        episodeTitle: episodeTitleData,
        video: videoData ? {
          id: videoData.id,
          hasAds: videoData.hasAds,
          lang: videoData.lang,
          pub: videoData.pub,
          quality: videoData.quality,
          server: videoData.server,
          url: videoData.url,
          serverIndex: videoData.serverIndex
        } : undefined
      }
      
      console.log('Creating history item with data:', {
        itemType,
        itemData,
        seasonData,
        episodeData,
        episodeTitleData,
        videoData,
        historyItem
      })
      
      // Si pas de backdrop, essayer de le récupérer depuis TMDB
      if (!historyItem.backdrop && itemData.id) {
        fetchBackdropFromTMDB(itemData.id, itemType).then(backdropUrl => {
          if (backdropUrl) {
            // Mettre à jour l'entrée avec le backdrop récupéré
            const history = cookieUtils.getWatchHistory()
            const updatedHistory = history.map(item => 
              item.id === itemData.id && 
              item.type === itemType && 
              item.episode?.season === seasonData && 
              item.episode?.episode === episodeData
                ? { ...item, poster: item.poster }
                : item
            )
            cookieUtils.setWatchHistory(updatedHistory)
          }
        })
      }

      // Récupérer l'historique existant
      const history = cookieUtils.getWatchHistory()
      
      // Convertir au format attendu pour la recherche
      // (ancien historique ne contient pas encore les infos vidéo ni backdrop)
      const convertedHistory: HistoryItem[] = history.map(item => ({
        type: item.type,
        id: item.id,
        title: item.title,
        poster: item.poster || '/placeholder-poster.jpg',
        backdrop: undefined,
        timestamp: new Date(item.watchedAt).getTime(),
        date: new Date(item.watchedAt).toLocaleDateString('fr-FR'),
        time: new Date(item.watchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        season: item.episode?.season,
        episode: item.episode?.episode,
        episodeTitle: undefined,
        video: undefined
      }))

      // Filtrer pour éviter les doublons (même type, id, saison et épisode)
      // MAIS préserver les informations de base si elles existent déjà
      const existingItem = convertedHistory.find(item => 
        item.type === itemType && 
        item.id === itemData.id && 
        item.season === seasonData && 
        item.episode === episodeData
      )

      // Si un élément existe déjà, préserver ses informations de base
      if (existingItem) {
        // Créer l'entrée mise à jour en préservant les informations existantes
        const updatedHistoryItem: HistoryItem = {
          ...existingItem, // Préserver toutes les informations existantes
          video: videoData ? { // Mettre à jour seulement les informations vidéo
            id: videoData.id,
            hasAds: videoData.hasAds,
            lang: videoData.lang,
            pub: videoData.pub,
            quality: videoData.quality,
            server: videoData.server,
            url: videoData.url,
            serverIndex: videoData.serverIndex
          } : undefined,
          timestamp: now.getTime(), // Mettre à jour le timestamp
          date: now.toLocaleDateString('fr-FR'), // Mettre à jour la date
          time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) // Mettre à jour l'heure
        }
        
        console.log('Updating existing history item:', updatedHistoryItem)
        
        // Remplacer l'ancienne entrée par la mise à jour
        const filtered = convertedHistory.filter(item => 
          !(item.type === itemType && 
            item.id === itemData.id && 
            item.season === seasonData && 
            item.episode === episodeData)
        )
        
        const newHistory = [updatedHistoryItem, ...filtered].slice(0, 50)
        
        // Convertir au format WatchHistoryItem pour le cookie
        const cookieHistory: WatchHistoryItem[] = newHistory.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          poster: item.poster,
          episode: item.episode && item.season ? {
            season: item.season,
            episode: item.episode
          } : undefined,
          watchedAt: new Date(item.timestamp).toISOString(),
          progress: undefined
        }))
        
        cookieUtils.setWatchHistory(cookieHistory)
        console.log('Full history saved (updated):', newHistory)
        return
      }
      // Ajouter au début et limiter à 50 éléments
      const filtered = convertedHistory.filter(item => 
        !(item.type === itemType && 
          item.id === itemData.id && 
          item.season === seasonData && 
          item.episode === episodeData)
      )
      const newHistory = [historyItem, ...filtered].slice(0, 50)
      
      // Convertir au format WatchHistoryItem pour le cookie
      const cookieHistory: WatchHistoryItem[] = newHistory.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        poster: item.poster,
        episode: item.episode && item.season ? {
          season: item.season,
          episode: item.episode
        } : undefined,
        watchedAt: new Date(item.timestamp).toISOString(),
        progress: undefined
      }))
      
      // Sauvegarder dans les cookies
      cookieUtils.setWatchHistory(cookieHistory)
      console.log('History item saved:', historyItem)
      console.log('Full history saved:', newHistory)

      sendHistoryToSupabase({
        contentId: itemData.id?.toString(),
        contentType: itemType,
        season: seasonData,
        episode: episodeData,
        metadata: {
          title: historyItem.title,
          poster: historyItem.poster,
          backdrop: historyItem.backdrop,
          episodeTitle: historyItem.episodeTitle,
          video: historyItem.video
        }
      })
    }

    if (type === 'movie' && movie) {
      addToHistory('movie', movie, undefined, undefined, undefined, video)
    } else if (type === 'series' && series) {
      addToHistory('series', series, season, episode, episodeTitle, video)
    }
  }, [type, movie, series, season, episode, episodeTitle, video, session])

  // Ce composant ne rend rien visuellement
  return null
}
