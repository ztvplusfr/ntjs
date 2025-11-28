import Cookies from 'js-cookie'

// Types pour les données stockées
export interface WatchHistoryItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  episode?: {
    season: number;
    episode: number;
  };
  watchedAt: string;
  progress?: number;
}

export interface SeriesPreferences {
  id: string;
  language: string;
  quality: string;
  autoPlay: boolean;
  subtitles: boolean;
  server?: string;
}

// Configuration des cookies
const COOKIE_CONFIG = {
  expires: 365, // 1 an
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  domain: process.env.NODE_ENV === 'production' ? undefined : undefined
}

// Fonctions utilitaires pour les cookies
export const cookieUtils = {
  // Watch History
  getWatchHistory: (): WatchHistoryItem[] => {
    try {
      const history = Cookies.get('watch-history')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Error parsing watch history from cookie:', error)
      return []
    }
  },

  setWatchHistory: (history: WatchHistoryItem[]): void => {
    try {
      Cookies.set('watch-history', JSON.stringify(history), COOKIE_CONFIG)
    } catch (error) {
      console.error('Error saving watch history to cookie:', error)
    }
  },

  addToWatchHistory: (item: WatchHistoryItem): void => {
    const history = cookieUtils.getWatchHistory()
    
    // Supprimer l'élément s'il existe déjà
    const filteredHistory = history.filter(h => 
      !(h.id === item.id && 
        (!item.episode || 
         (h.episode && h.episode.season === item.episode.season && h.episode.episode === item.episode.episode)))
    )
    
    // Ajouter au début
    const newHistory = [item, ...filteredHistory].slice(0, 50) // Limiter à 50 éléments
    cookieUtils.setWatchHistory(newHistory)
  },

  removeFromWatchHistory: (id: string, episode?: { season: number; episode: number }): void => {
    const history = cookieUtils.getWatchHistory()
    const newHistory = history.filter(h => 
      !(h.id === id && 
        (!episode || 
         (h.episode && h.episode.season === episode.season && h.episode.episode === episode.episode)))
    )
    cookieUtils.setWatchHistory(newHistory)
  },

  clearWatchHistory: (): void => {
    Cookies.remove('watch-history')
  },

  // Series Preferences
  getSeriesPreferences: (seriesId: string): SeriesPreferences | null => {
    try {
      const prefs = Cookies.get(`series-${seriesId}-preferences`)
      return prefs ? JSON.parse(prefs) : null
    } catch (error) {
      console.error('Error parsing series preferences from cookie:', error)
      return null
    }
  },

  setSeriesPreferences: (seriesId: string, preferences: SeriesPreferences): void => {
    try {
      Cookies.set(`series-${seriesId}-preferences`, JSON.stringify(preferences), COOKIE_CONFIG)
    } catch (error) {
      console.error('Error saving series preferences to cookie:', error)
    }
  },

  // Migration depuis localStorage
  migrateFromLocalStorage: (): void => {
    if (typeof window === 'undefined') return

    try {
      // Migrer watch-history
      const oldHistory = localStorage.getItem('watch-history')
      if (oldHistory && !Cookies.get('watch-history')) {
        Cookies.set('watch-history', oldHistory, COOKIE_CONFIG)
        localStorage.removeItem('watch-history')
      }

      // Migrer les préférences de séries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('series-') && key.endsWith('-preferences')) {
          const value = localStorage.getItem(key)
          if (value) {
            Cookies.set(key, value, COOKIE_CONFIG)
            localStorage.removeItem(key)
          }
        }
      })

      // Nettoyer l'ancien format watchHistory
      const oldFormat = localStorage.getItem('watchHistory')
      if (oldFormat) {
        localStorage.removeItem('watchHistory')
      }
    } catch (error) {
      console.error('Error during migration from localStorage:', error)
    }
  }
}
