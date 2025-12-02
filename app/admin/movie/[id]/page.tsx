'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Film, Plus, Trash2, Save, Eye, Code, Video, Globe, Calendar, Star, ArrowLeft } from 'lucide-react'

interface Video {
  name: string
  url: string
  lang: string
  quality: string
  pub: number
  play: number
}

interface MovieData {
  videos: Video[]
}

interface TMDBData {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  original_language: string
  genres: Array<{ id: number; name: string }>
}

interface MovieDetails {
  id: string
  pathname: string
  uploadedAt: string
  size: number
  url: string
  movieData: MovieData
  tmdbData?: TMDBData
  extractedId?: string
}

export default function EditMovie() {
  const params = useParams()
  const router = useRouter()
  const movieId = params.id as string

  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'code'>('edit')
  const [movieData, setMovieData] = useState<MovieData>({ videos: [] })
  const [newVideo, setNewVideo] = useState<Video>({
    name: '',
    url: '',
    lang: 'fr',
    quality: '720p',
    pub: 0,
    play: 1
  })

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/admin/movie/${movieId}`)
        if (response.ok) {
          const data = await response.json()
          setMovie(data)
          setMovieData(data.movieData)
        } else {
          console.error('Movie not found')
          router.push('/admin/movies')
        }
      } catch (error) {
        console.error('Error fetching movie:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [movieId, router])

  const addVideo = () => {
    if (newVideo.name && newVideo.url) {
      setMovieData(prev => ({
        videos: [...prev.videos, { ...newVideo }]
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

  const removeVideo = (index: number) => {
    setMovieData(prev => ({
      videos: prev.videos.filter((_, i) => i !== index)
    }))
  }

  const updateVideo = (index: number, field: keyof Video, value: string | number) => {
    setMovieData(prev => ({
      videos: prev.videos.map((video, i) => 
        i === index ? { ...video, [field]: value } : video
      )
    }))
  }

  const saveMovie = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/movie/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Movie saved:', result)
        // Mettre à jour les infos du film
        setMovie(prev => prev ? { ...prev, ...result } : null)
      } else {
        console.error('Failed to save movie')
      }
    } catch (error) {
      console.error('Error saving movie:', error)
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

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto text-center">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p>Film non trouvé</p>
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
              onClick={() => router.push('/admin/movies')}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Film className="w-8 h-8 text-blue-400" />
              {movie.tmdbData?.title || movie.extractedId || `Film ${movieId}`}
            </h1>
          </div>
          
          {movie.tmdbData && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(movie.tmdbData.release_date).getFullYear()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {movie.tmdbData.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {movie.tmdbData.original_language.toUpperCase()}
              </span>
              <span>
                Fichier: {movie.pathname.split('/').pop()}
              </span>
              <span>
                Taille: {formatFileSize(movie.size)}
              </span>
              <span>
                Modifié: {formatDate(movie.uploadedAt)}
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
                ? 'text-white border-b-2 border-blue-400' 
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
                ? 'text-white border-b-2 border-blue-400' 
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
                <h2 className="text-xl font-semibold mb-6">Vidéos du film</h2>
                
                {/* Add New Video */}
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ajouter une vidéo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nom du serveur"
                      value={newVideo.name}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
                    />
                    <input
                      type="url"
                      placeholder="URL de la vidéo"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, url: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
                    />
                    <select
                      value={newVideo.lang}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, lang: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                    </select>
                    <select
                      value={newVideo.quality}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, quality: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
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
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Existing Videos */}
                <div className="space-y-4">
                  {movieData.videos && movieData.videos.map((video, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Vidéo {index + 1}</h4>
                        <button
                          onClick={() => removeVideo(index)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={video.name}
                          onChange={(e) => updateVideo(index, 'name', e.target.value)}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
                        />
                        <input
                          type="url"
                          value={video.url}
                          onChange={(e) => updateVideo(index, 'url', e.target.value)}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
                        />
                        <select
                          value={video.lang}
                          onChange={(e) => updateVideo(index, 'lang', e.target.value)}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                          <option value="it">Italiano</option>
                        </select>
                        <select
                          value={video.quality}
                          onChange={(e) => updateVideo(index, 'quality', e.target.value)}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
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
                            onChange={(e) => updateVideo(index, 'pub', e.target.checked ? 1 : 0)}
                            className="w-4 h-4"
                          />
                          <label className="text-sm">Pub</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={video.play === 1}
                            onChange={(e) => updateVideo(index, 'play', e.target.checked ? 1 : 0)}
                            className="w-4 h-4"
                          />
                          <label className="text-sm">Play</label>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Video className="w-4 h-4" />
                          {video.quality}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(!movieData.videos || movieData.videos.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucune vidéo ajoutée</p>
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
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(movieData, null, 2))}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    Copier
                  </button>
                </div>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
                  <code>{JSON.stringify(movieData, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Movie Poster */}
            {movie.tmdbData?.poster_path && (
              <div className="bg-black rounded-lg p-4 border border-white/20">
                <h3 className="text-lg font-medium mb-3">Affiche</h3>
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.tmdbData.poster_path}`}
                  alt={movie.tmdbData.title}
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {/* Actions */}
            <div className="bg-black rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-medium mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={saveMovie}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => window.open(movie.url, '_blank')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
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
                  <span>{movieData.videos?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pub:</span>
                  <span>{movieData.videos?.filter(v => v.pub === 1).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Play:</span>
                  <span>{movieData.videos?.filter(v => v.play === 1).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Privé:</span>
                  <span>{movieData.videos?.filter(v => v.pub === 0).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Qualités:</span>
                  <span>{movieData.videos ? [...new Set(movieData.videos.map(v => v.quality))].join(', ') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Langues:</span>
                  <span>{movieData.videos ? [...new Set(movieData.videos.map(v => v.lang))].join(', ') : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
