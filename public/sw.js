// shortcut: sem cache offline, só push; o cache entra na Fase 1B (vite-plugin-pwa).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data.json()
  } catch {
    d = { corpo: e.data?.text() }
  }
  // iOS revoga a inscrição se um push não mostrar notificação: sempre mostrar.
  e.waitUntil(
    self.registration.showNotification(d.titulo || 'organiza.ai', {
      body: d.corpo || '',
      icon: 'icone-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(self.clients.openWindow(self.registration.scope))
})
