// shortcut: cache em tempo de execução (o app só abre offline depois de uma abertura online), trocar por precache se isso incomodar.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== 'organiza-v1').map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  ),
)

// Rede primeiro, cache como reserva. Só mesma origem (api.github.com leva token).
self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone()
          caches.open('organiza-v1').then((c) => c.put(request, copia))
        }
        return resp
      })
      .catch(async () => {
        const c = await caches.open('organiza-v1')
        return (await c.match(request)) || (request.mode === 'navigate' && (await c.match(self.registration.scope + 'index.html'))) || Response.error()
      }),
  )
})

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
