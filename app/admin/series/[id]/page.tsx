'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tv, Plus, Trash2, Save, Eye, Code, Video, Globe, Hd, Calendar, Star, ArrowLeft, Edit } from 'lucide-react'

interface Video {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
}

interface Episode {
  videos: Video[]
}

interface Season {
  episodes: Record<string, Episode>
}

interface SeriesData {
  season: Record<string, Season>
}

interface TMDBData {
  id: number
  name: string
  poster_path: string
  backdrop_path: string
  overview: string
  first_air_date: string
  last_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  original_language: string
  genres: Array<{ id: number; name: string }>
  number_of_seasons: number
  number_of_episodes: number
  status: string
}

interface SeriesDetails {
  id: string
  pathname: string
  uploadedAt: string
  size: number
  url: string
  seriesData: SeriesData
  tmdbData?: TMDBData
  extractedId?: string
}

export default function EditSeries() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.id as string

  const [series, setSeries] = useState<SeriesDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'code'>('edit')
  const [seriesData, setSeriesData] = useState<SeriesData>({ season: {} })
  const [selectedSeason, setSelectedSeason] = useState<string>('1')
  const [selectedEpisode, setSelectedEpisode] = useState<string>('1')
  const [moveTargets, setMoveTargets] = useState<Record<string, { season: string; episode: string }>>({})
  const [editingVideo, setEditingVideo] = useState<string | null>(null)
  const [newVideo, setNewVideo] = useState<Video>({
    name: '',
    url: '',
    lang: 'fr',
    quality: '720p',
    pub: 0,
    play: 1
  })

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await fetch(`/api/admin/series/${seriesId}`)
        if (response.ok) {
          const data = await response.json()
          setSeries(data)
          setSeriesData(data.seriesData)
        } else {
          console.error('Series not found')
          router.push('/admin/series')
        }
      } catch (error) {
        console.error('Error fetching series:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [seriesId, router])

  const addVideo = () => {
    if (newVideo.name && newVideo.url) {
      setSeriesData(prev => ({
        season: {
          ...prev.season,
          [selectedSeason]: {
            ...prev.season[selectedSeason],
            episodes: {
              ...prev.season[selectedSeason]?.episodes,
              [selectedEpisode]: {
                videos: [
                  ...(prev.season[selectedSeason]?.episodes[selectedEpisode]?.videos || []),
                  { 
                    ...newVideo,
                    pub: typeof newVideo.pub === 'number' ? newVideo.pub : 0,
                    play: typeof newVideo.play === 'number' ? newVideo.play : 1
                  }
                ]
              }
            }
          }
        }
      }))
      setNewVideo({
        name: '',
        url: '',
        lang: 'fr',
        quality: '720p',
        pub: 0,
        play: 1
      })
    }
  }

  const removeVideo = (seasonNumber: string, episodeNumber: string, videoIndex: number) => {
    setSeriesData(prev => ({
      season: {
        ...prev.season,
        [seasonNumber]: {
          ...prev.season[seasonNumber],
          episodes: {
            ...prev.season[seasonNumber].episodes,
            [episodeNumber]: {
              videos: prev.season[seasonNumber].episodes[episodeNumber].videos.filter((_, i) => i !== videoIndex)
            }
          }
        }
      }
    }))
  }

  const updateVideo = (seasonNumber: string, episodeNumber: string, videoIndex: number, field: keyof Video, value: string | number) => {
    setSeriesData(prev => ({
      season: {
        ...prev.season,
        [seasonNumber]: {
          ...prev.season[seasonNumber],
          episodes: {
            ...prev.season[seasonNumber].episodes,
            [episodeNumber]: {
              videos: prev.season[seasonNumber].episodes[episodeNumber].videos.map((video, i) => {
                if (i === videoIndex) {
                  const updatedVideo = { ...video, [field]: value }
                  // S'assurer que pub et play sont toujours des nombres valides
                  if (field === 'pub') {
                    updatedVideo.pub = typeof value === 'number' && (value === 0 || value === 1) ? value : video.pub
                  }
                  if (field === 'play') {
                    updatedVideo.play = typeof value === 'number' && (value === 0 || value === 1) ? value : video.play
                  }
                  return updatedVideo
                }
                return video
              })
            }
          }
        }
      }
    }))
  }

  const addSeason = () => {
    const newSeasonNumber = (Object.keys(seriesData.season).length + 1).toString()
    setSeriesData(prev => ({
      season: {
        ...prev.season,
        [newSeasonNumber]: {
          episodes: {}
        }
      }
    }))
  }

  const addEpisode = (seasonNumber: string) => {
    const season = seriesData.season[seasonNumber]
    const newEpisodeNumber = (Object.keys(season?.episodes || {}).length + 1).toString()
    setSeriesData(prev => ({
      season: {
        ...prev.season,
        [seasonNumber]: {
          ...prev.season[seasonNumber],
          episodes: {
            ...prev.season[seasonNumber]?.episodes,
            [newEpisodeNumber]: {
              videos: []
            }
          }
        }
      }
    }))
  }

  const removeSeason = (seasonNumber: string) => {
    setSeriesData(prev => {
      const newSeason = { ...prev.season }
      delete newSeason[seasonNumber]
      return { season: newSeason }
    })
  }

  const removeEpisode = (seasonNumber: string, episodeNumber: string) => {
    setSeriesData(prev => {
      const newSeason = { ...prev.season }
      if (newSeason[seasonNumber]?.episodes[episodeNumber]) {
        delete newSeason[seasonNumber].episodes[episodeNumber]
      }
      return { season: newSeason }
    })
  }

  const moveVideo = (fromSeason: string, fromEpisode: string, videoIndex: number, toSeason: string, toEpisode: string) => {
    setSeriesData(prev => {
      const video = prev.season[fromSeason]?.episodes[fromEpisode]?.videos[videoIndex]
      if (!video) return prev

      const newData = { ...prev.season }
      
      // Retirer la vidéo de l'emplacement d'origine
      if (newData[fromSeason]?.episodes[fromEpisode]) {
        newData[fromSeason].episodes[fromEpisode].videos = newData[fromSeason].episodes[fromEpisode].videos.filter((_, i) => i !== videoIndex)
      }
      
      // Ajouter la vidéo au nouvel emplacement
      if (!newData[toSeason]) {
        newData[toSeason] = { episodes: {} }
      }
      if (!newData[toSeason].episodes[toEpisode]) {
        newData[toSeason].episodes[toEpisode] = { videos: [] }
      }
      newData[toSeason].episodes[toEpisode].videos.push(video)
      
      return { season: newData }
    })
  }

  const updateMoveTarget = (videoKey: string, field: 'season' | 'episode', value: string) => {
    setMoveTargets(prev => ({
      ...prev,
      [videoKey]: {
        ...prev[videoKey],
        [field]: value
      }
    }))
  }

  const applyMove = (seasonNum: string, episodeNum: string, videoIndex: number) => {
    const videoKey = `${seasonNum}-${episodeNum}-${videoIndex}`
    const target = moveTargets[videoKey]
    if (target && target.season && target.episode) {
      moveVideo(seasonNum, episodeNum, videoIndex, target.season, target.episode)
      // Nettoyer les cibles après le déplacement
      setMoveTargets(prev => {
        const newTargets = { ...prev }
        delete newTargets[videoKey]
        return newTargets
      })
    }
  }

  const saveSeries = async () => {
    setSaving(true)
    try {
      console.log('Saving series with data:', JSON.stringify(seriesData, null, 2))
      
      const response = await fetch(`/api/admin/series/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seriesData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const result = await response.json()
        console.log('Series saved successfully:', result)
        // Mettre à jour les infos de la série
        setSeries(prev => prev ? { ...prev, ...result } : null)
      } else {
        const errorText = await response.text()
        console.error('Failed to save series - Status:', response.status)
        console.error('Failed to save series - Response:', errorText)
        
        try {
          const errorJson = JSON.parse(errorText)
          console.error('Failed to save series - JSON error:', errorJson)
        } catch (e) {
          console.error('Failed to save series - Non-JSON error:', errorText)
        }
      }
    } catch (error) {
      console.error('Error saving series:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculer les statistiques pour toutes les vidéos
  const getAllVideos = () => {
    const allVideos: Video[] = []
    Object.values(seriesData.season).forEach(season => {
      Object.values(season.episodes).forEach(episode => {
        allVideos.push(...(episode.videos || []))
      })
    })
    return allVideos
  }

  const allVideos = getAllVideos()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black rounded-lg p-6 border border-white/20">
                <div className="h-32 bg-white/10 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              </div>
              <div className="bg-black rounded-lg p-6 border border-white/20">
                <div className="h-32 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto text-center">
          <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p>Série non trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin/series')}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Tv className="w-8 h-8 text-purple-400" />
              {series.tmdbData?.name || series.extractedId || `Série ${seriesId}`}
            </h1>
          </div>
          
          {series.tmdbData && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(series.tmdbData.first_air_date).getFullYear()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {series.tmdbData.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {series.tmdbData.original_language.toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                {series.tmdbData.number_of_seasons}S / {series.tmdbData.number_of_episodes}E
              </span>
              <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs">
                {series.tmdbData.status}
              </span>
              <span>
                Fichier: {series.pathname.split('/').pop()}
              </span>
              <span>
                Taille: {formatFileSize(series.size)}
              </span>
              <span>
                Modifié: {formatDate(series.uploadedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              activeTab === 'edit' 
                ? 'text-white border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Édition des vidéos
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              activeTab === 'code' 
                ? 'text-white border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            Code JSON
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'edit' ? (
              <div className="bg-black rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-6">Saisons et Épisodes</h2>
                
                {/* Edit Existing Video Section */}
                {editingVideo && (() => {
                  const [seasonNum, episodeNum, videoIndex] = editingVideo.split('-').map(Number)
                  const video = seriesData.season[seasonNum.toString()]?.episodes[episodeNum.toString()]?.videos[videoIndex]
                  if (!video) return null
                  
                  return (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-purple-400">Modification de la vidéo</h3>
                        <button
                          onClick={() => setEditingVideo(null)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-purple-300">Saison</label>
                          <input
                            type="number"
                            min="1"
                            value={seasonNum}
                            onChange={(e) => {
                              const newSeason = e.target.value
                              const newEpisode = episodeNum.toString()
                              setMoveTargets(prev => ({
                                ...prev,
                                [editingVideo]: { season: newSeason, episode: newEpisode }
                              }))
                            }}
                            className="w-full px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-purple-300">Épisode</label>
                          <input
                            type="number"
                            min="1"
                            value={episodeNum}
                            onChange={(e) => {
                              const newSeason = seasonNum.toString()
                              const newEpisode = e.target.value
                              setMoveTargets(prev => ({
                                ...prev,
                                [editingVideo]: { season: newSeason, episode: newEpisode }
                              }))
                            }}
                            className="w-full px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={video.name}
                          onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'name', e.target.value)}
                          className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          placeholder="Nom du serveur"
                        />
                        <input
                          type="url"
                          value={video.url}
                          onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'url', e.target.value)}
                          className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          placeholder="URL de la vidéo"
                        />
                        <select
                          value={video.lang}
                          onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'lang', e.target.value)}
                          className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                        >
                          <option value="fr">Français</option>
                          <option value="vostfr">VOSTFR</option>
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                          <option value="it">Italiano</option>
                        </select>
                        <select
                          value={video.quality}
                          onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'quality', e.target.value)}
                          className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                        >
                          <option value="360p">360p</option>
                          <option value="480p">480p</option>
                          <option value="720p">720p</option>
                          <option value="1080p">1080p</option>
                          <option value="4K">4K</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={video.pub === 1}
                            onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'pub', e.target.checked ? 1 : 0)}
                            className="w-4 h-4"
                          />
                          <label className="text-sm text-purple-300">Pub</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={video.play === 1}
                            onChange={(e) => updateVideo(seasonNum.toString(), episodeNum.toString(), videoIndex, 'play', e.target.checked ? 1 : 0)}
                            className="w-4 h-4"
                          />
                          <label className="text-sm text-purple-300">Play</label>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => applyMove(seasonNum.toString(), episodeNum.toString(), videoIndex)}
                          className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                          Appliquer les changements
                        </button>
                        <button
                          onClick={() => removeVideo(seasonNum.toString(), episodeNum.toString(), videoIndex)}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )
                })()}
                
                {/* Season and Episode Selector */}
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Saison</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                        placeholder="Numéro de saison"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Épisode</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedEpisode}
                        onChange={(e) => setSelectedEpisode(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                        placeholder="Numéro d'épisode"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => addEpisode(selectedSeason)}
                        className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        Ajouter épisode
                      </button>
                      <button
                        onClick={addSeason}
                        className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        Ajouter saison
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add New Video */}
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ajouter une vidéo - S{selectedSeason}E{selectedEpisode}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nom du serveur"
                      value={newVideo.name}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                    />
                    <input
                      type="url"
                      placeholder="URL de la vidéo"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, url: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                    />
                    <select
                      value={newVideo.lang}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, lang: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                    >
                      <option value="fr">Français</option>
                      <option value="vostfr">VOSTFR</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                    </select>
                    <select
                      value={newVideo.quality}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, quality: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                    >
                      <option value="360p">360p</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pub"
                        checked={newVideo.pub === 1}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, pub: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor="pub" className="text-sm">Pub</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="play"
                        checked={newVideo.play === 1}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, play: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor="play" className="text-sm">Play</label>
                    </div>
                    <button
                      onClick={addVideo}
                      disabled={!newVideo.name || !newVideo.url}
                      className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Seasons and Episodes */}
                <div className="space-y-6">
                  {Object.entries(seriesData.season).map(([seasonNum, season]) => (
                    <div key={seasonNum} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Saison {seasonNum}</h3>
                        <button
                          onClick={() => removeSeason(seasonNum)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.entries(season.episodes).map(([episodeNum, episode]) => (
                          <div key={episodeNum} className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Épisode {episodeNum}</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => removeEpisode(seasonNum, episodeNum)}
                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Videos for this episode */}
                            <div className="space-y-2">
                              {episode.videos && episode.videos.map((video, videoIndex) => {
                                const videoKey = `${seasonNum}-${episodeNum}-${videoIndex}`
                                const isEditingThisVideo = editingVideo === videoKey
                                
                                return (
                                  <div key={videoIndex} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">Vidéo {videoIndex + 1}</span>
                                      <div className="flex gap-2">
                                        {!isEditingThisVideo && (
                                          <button
                                            onClick={() => setEditingVideo(videoKey)}
                                            className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                            title="Modifier la vidéo"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => removeVideo(seasonNum, episodeNum, videoIndex)}
                                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Video info (read-only) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Serveur:</span> {video.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Qualité:</span> {video.quality}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Langue:</span> {video.lang}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Pub:</span> {video.pub === 1 ? 'Oui' : 'Non'}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Play:</span> {video.play === 1 ? 'Oui' : 'Non'}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">Position:</span> S{seasonNum}E{episodeNum}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                              
                              {(!episode.videos || episode.videos.length === 0) && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  <Video className="w-8 h-8 mx-auto mb-1" />
                                  <p>Aucune vidéo pour cet épisode</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {(!season.episodes || Object.keys(season.episodes).length === 0) && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <p>Aucun épisode dans cette saison</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(!seriesData.season || Object.keys(seriesData.season).length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Tv className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucune saison ajoutée</p>
                    <button
                      onClick={addSeason}
                      className="mt-4 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter la première saison
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code JSON
                  </h2>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(seriesData, null, 2))}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    Copier
                  </button>
                </div>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
                  <code>{JSON.stringify(seriesData, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Series Poster */}
            {series.tmdbData?.poster_path && (
              <div className="bg-black rounded-lg p-4 border border-white/20">
                <h3 className="text-lg font-medium mb-3">Affiche</h3>
                <img
                  src={`https://image.tmdb.org/t/p/w500${series.tmdbData.poster_path}`}
                  alt={series.tmdbData.name}
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {/* Actions */}
            <div className="bg-black rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-medium mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={saveSeries}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => window.open(series.url, '_blank')}
                  className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Voir le fichier
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-black rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-medium mb-3">Statistiques</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total vidéos:</span>
                  <span>{allVideos?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pub:</span>
                  <span>{allVideos?.filter(v => v.pub === 1).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Play:</span>
                  <span>{allVideos?.filter(v => v.play === 1).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Privé:</span>
                  <span>{allVideos?.filter(v => v.pub === 0).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Qualités:</span>
                  <span>{allVideos ? [...new Set(allVideos.map(v => v.quality))].join(', ') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Langues:</span>
                  <span>{allVideos ? [...new Set(allVideos.map(v => v.lang))].join(', ') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saisons:</span>
                  <span>{Object.keys(seriesData.season).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Épisodes:</span>
                  <span>{Object.values(seriesData.season).reduce((total, season) => total + Object.keys(season.episodes).length, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
