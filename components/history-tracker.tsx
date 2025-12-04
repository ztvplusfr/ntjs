'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const [hasTracked, setHasTracked] = useState(false)

  const sendHistoryToSupabase = async (payload: {
    contentId: string
    contentType: 'movie' | 'series'
    season?: number
    episode?: number
    title: string
    poster?: string
    backdrop?: string
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
  }) => {
    try {
      // Récupérer le token JWT depuis next-auth
      const tokenResponse = await fetch('/api/auth/token')
      if (!tokenResponse.ok) {
        console.error('Failed to get auth token')
        return
      }
      const { token } = await tokenResponse.json()

      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_id: payload.contentId,
          content_type: payload.contentType,
          season: payload.season,
          episode: payload.episode,
          title: payload.title,
          poster: payload.poster,
          backdrop: payload.backdrop,
          episode_title: payload.episodeTitle,
          video_id: payload.video?.id,
          video_has_ads: payload.video?.hasAds,
          video_lang: payload.video?.lang,
          video_pub: payload.video?.pub,
          video_quality: payload.video?.quality,
          video_server: payload.video?.server,
          video_url: payload.video?.url,
          video_server_index: payload.video?.serverIndex,
          progress_seconds: 0,
          duration_seconds: undefined,
          metadata: {
            episodeTitle: payload.episodeTitle,
            video: payload.video
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('History API error:', response.status, errorText)

        // Si c'est une erreur de duplicate (409), c'est normal - on met à jour
        if (response.status === 409) {
          const updateResponse = await fetch('/api/history', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content_id: payload.contentId,
              content_type: payload.contentType,
              season: payload.season,
              episode: payload.episode,
              title: payload.title,
              poster: payload.poster,
              backdrop: payload.backdrop,
              episode_title: payload.episodeTitle,
              video_id: payload.video?.id,
              video_has_ads: payload.video?.hasAds,
              video_lang: payload.video?.lang,
              video_pub: payload.video?.pub,
              video_quality: payload.video?.quality,
              video_server: payload.video?.server,
              video_url: payload.video?.url,
              video_server_index: payload.video?.serverIndex,
              progress_seconds: 0,
              duration_seconds: undefined,
              metadata: {
                episodeTitle: payload.episodeTitle,
                video: payload.video
              }
            })
          })

          if (!updateResponse.ok) {
            const updateErrorText = await updateResponse.text()
            console.error('History PUT API error:', updateResponse.status, updateErrorText)
          }
        }
      } else {
        console.log('History saved successfully')
      }
    } catch (error) {
      console.error('Error saving history to Supabase:', error)
    }
  }

  const addToHistory = async (
    itemType: 'movie' | 'series',
    itemData: any,
    seasonData?: number,
    episodeData?: number,
    episodeTitleData?: string,
    videoData?: any
  ) => {
    try {
      // Créer l'objet history item selon l'interface correcte
      const historyItem: WatchHistoryItem = {
        id: itemData.id?.toString(),
        title: itemType === 'movie' ? itemData.title : itemData.name,
        type: itemType,
        poster: itemData.poster_path ? `https://image.tmdb.org/t/p/w500${itemData.poster_path}` : undefined,
        episode: (seasonData && episodeData) ? {
          season: seasonData,
          episode: episodeData
        } : undefined,
        watchedAt: new Date().toLocaleString('fr-RE', { 
          timeZone: 'Indian/Reunion',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-'), // Format DD-MM-YYYY HH:MM:SS
        progress: 0
      }

      // Récupérer l'historique existant depuis les cookies
      const existingHistory = cookieUtils.getWatchHistory()
      
      // Filtrer les doublons et ajouter le nouvel élément au début
      // Pour les films: vérifier uniquement id et type
      // Pour les séries: vérifier id, type, season et episode
      const filteredHistory = existingHistory.filter(item => {
        if (historyItem.type === 'movie') {
          // Pour les films, vérifier uniquement id et type
          return !(item.type === historyItem.type && item.id === historyItem.id)
        } else {
          // Pour les séries, vérifier id, type, season et episode
          return !(item.type === historyItem.type && 
            item.id === historyItem.id && 
            item.episode?.season === historyItem.episode?.season && 
            item.episode?.episode === historyItem.episode?.episode)
        }
      })
      
      const newHistory = [historyItem, ...filteredHistory].slice(0, 50) // Limiter à 50 éléments
      
      // Sauvegarder dans les cookies
      cookieUtils.setWatchHistory(newHistory)

      // Envoyer à Supabase avec toutes les données complètes
      await sendHistoryToSupabase({
        contentId: itemData.id?.toString(),
        contentType: itemType,
        season: seasonData,
        episode: episodeData,
        title: historyItem.title,
        poster: historyItem.poster,
        backdrop: itemData.backdrop_path ? `https://image.tmdb.org/t/p/w780${itemData.backdrop_path}` : undefined,
        episodeTitle: episodeTitleData,
        video: videoData
      })
    } catch (error) {
      console.error('Error calling sendHistoryToSupabase:', error)
    }
  }

  useEffect(() => {
    // Ne pas tracker si déjà fait ou si pas de session
    if (hasTracked || !session) {
      return
    }
    
    try {
      // Récupérer les infos vidéo depuis la prop video d'abord (plus fiable)
      let videoInfo = video
      
      // Si pas de video prop, essayer de récupérer depuis l'URL
      if (!videoInfo && searchParams) {
        const urlServer = searchParams.get('server')
        const urlLang = searchParams.get('lang') || searchParams.get('language')
        const urlQuality = searchParams.get('quality')
        const urlVideoId = searchParams.get('videoId')
        
        if (urlServer && urlLang && urlQuality) {
          videoInfo = {
            id: urlVideoId || `video-${urlServer}-${urlLang}-${urlQuality}`,
            server: urlServer,
            lang: urlLang,
            quality: urlQuality,
            url: '',
            hasAds: false,
            pub: 0,
            serverIndex: parseInt(urlServer) || 0
          }
        }
      }
      
      // Si toujours pas de videoInfo, créer une entrée basique sans infos vidéo
      if (!videoInfo && (movie || series)) {
        console.log('HistoryTracker: No video info available, creating basic history entry')
        videoInfo = {
          id: 'default-video',
          server: 'default',
          lang: 'unknown',
          quality: 'unknown',
          url: '',
          hasAds: false,
          pub: 0,
          serverIndex: 0
        }
      }
      
      const processHistory = async () => {
        if (type === 'movie' && movie) {
          await addToHistory('movie', movie, undefined, undefined, undefined, videoInfo)
        } else if (type === 'series' && series) {
          await addToHistory('series', series, season, episode, episodeTitle, videoInfo)
        }
        // Marquer comme tracker pour éviter les doublons
        setHasTracked(true)
      }
      
      processHistory().catch(console.error)
    } catch (error) {
      console.error('Error in HistoryTracker useEffect:', error)
    }
  }, [type, movie, series, season, episode, episodeTitle, video, searchParams, session, hasTracked])

  // Ce composant ne rend rien visuellement
  return null
}
