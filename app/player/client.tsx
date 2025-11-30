'use client'

import { useState } from 'react'
import VideoPlayer from '@/components/video-player'
import PageHead from '@/components/page-head'

export default function PlayerClient() {
  const [selectedVideo, setSelectedVideo] = useState({
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny - Vidéo de test',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
  })

  const testVideos = [
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Big Buck Bunny - Vidéo de test',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'Elephants Dream - Animation 3D',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'For Bigger Blazes - Google',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      title: 'Sintel - Animation courte',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg'
    }
  ]

  return (
    <>
      <PageHead 
        title="Player Test - ZTVPlus"
        description="Test du lecteur vidéo optimisé pour tous les appareils"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Lecteur Vidéo Optimisé</h1>
            <p className="text-gray-400">Compatible Mobile • PC • TV • iOS • Android</p>
          </div>

          {/* Sélecteur de vidéos */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Choisir une vidéo de test :</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {testVideos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVideo(video)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedVideo.url === video.url
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{video.title}</div>
                  <div className="text-xs text-gray-400">Clique pour tester</div>
                </button>
              ))}
            </div>
          </div>

          {/* Lecteur vidéo */}
          <div className="mb-8">
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <div className="aspect-video max-w-6xl mx-auto">
                <VideoPlayer
                  src={selectedVideo.url}
                  poster={selectedVideo.poster}
                  title={selectedVideo.title}
                  controls={true}
                  autoplay={false}
                  loop={false}
                  muted={false}
                  autoPlayWhenChanged={true}
                />
              </div>
            </div>
          </div>

          {/* Informations techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-black/30 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">📱 Mobile Optimisé</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Touch controls intuitifs</li>
                <li>• Gestes swipe pour progresser</li>
                <li>• Auto-rotation supportée</li>
                <li>• Performance optimisée</li>
                <li>• Mode paysage/portrait</li>
              </ul>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">🖥️ Desktop Features</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Keyboard shortcuts</li>
                <li>• Mouse wheel volume</li>
                <li>• Double click fullscreen</li>
                <li>• Drag to seek</li>
                <li>• Right-click menu disabled</li>
              </ul>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">📺 TV & Large Screens</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• D-pad navigation</li>
                <li>• Large touch targets</li>
                <li>• 10-foot interface</li>
                <li>• Remote control support</li>
                <li>• High contrast mode</li>
              </ul>
            </div>
          </div>

          {/* Caractéristiques techniques */}
          <div className="mt-8 bg-black/30 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🚀 Caractéristiques Techniques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Formats MP4/WebM/HLS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Adaptive Bitrate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Subtitles support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Picture-in-Picture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">AirPlay support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Chromecast ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Low latency mode</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Hardware acceleration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Memory efficient</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Testez le lecteur avec différentes vidéos et appareils pour vérifier la compatibilité.</p>
            <p className="mt-2">Le lecteur supporte les gestes tactiles, les raccourcis clavier et les contrôles TV.</p>
          </div>
        </div>
      </div>
    </>
  )
}
