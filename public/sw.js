// Service Worker for PWA and Push Notifications

const CACHE_NAME = 'sasaeai-v1'
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  event.waitUntil(clients.claim())
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip API requests and external requests
  if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()

  const options = {
    body: data.body || "",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      {
        action: "open",
        title: "開く",
      },
      {
        action: "close",
        title: "閉じる",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title || "ささえ愛", options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") {
    return
  }

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 既に開いているウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
