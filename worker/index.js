// Custom worker code for next-pwa
// This file will be automatically injected into the generated service worker

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

// Notification click handler
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
