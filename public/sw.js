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

// Gestion des requêtes - pas de cache, juste passer les requêtes
self.addEventListener('fetch', (event) => {
  // Pour une PWA sans cache, on laisse passer toutes les requêtes
  // Cela permet à l'app de fonctionner offline seulement si le navigateur le supporte nativement
  event.respondWith(fetch(event.request))
})

// Gestion des messages depuis l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
