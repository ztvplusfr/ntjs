// Service Worker minimal pour ZTVPlus PWA
// Pas de cache pour une expérience légère

const CACHE_NAME = 'ztvplus-v1'

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  // Force l'activation immédiate
  self.skipWaiting()
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  // Nettoyer les anciens caches si nécessaire
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Prendre le contrôle immédiatement
  event.waitUntil(self.clients.claim())
})

// Gestion des requêtes - AUCUN CACHE, toujours fetch depuis le réseau
self.addEventListener('fetch', (event) => {
  // Forcer le fetch depuis le réseau sans cache
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store', // Pas de cache du tout
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).catch(() => {
      // En cas d'erreur réseau, retourner une réponse d'erreur
      return new Response('Connexion réseau requise', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    })
  )
})

// Gestion des messages depuis l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
