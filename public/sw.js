// Service Worker — Web Push notifications
// Minimal worker. Boshqa caching strategiyalar kelajakda qo'shilishi mumkin.

// Frontend client tomonidan o'rnatiladigan holat — hozir foydalanuvchi qaysi chat'ni
// ochib turibdi. Faqat shu sender'dan push kelsa OS bildirishnomasini o'tkazib yuboramiz.
let activeChatSenderId = null

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'set-active-chat') {
    activeChatSenderId = data.partnerId || null
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (_e) {
    payload = { title: 'Smart assistant', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Smart assistant'
  const data = payload.data || {}
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    tag: payload.tag || 'smart-assistant',
    // renotify: true — bir xil tag bilan keyingi push kelsa ham popup/ovoz chiqsin
    renotify: Boolean(payload.tag),
    data: { ...data, url: payload.url || '/' },
    requireInteraction: Boolean(payload.is_important),
  }

  event.waitUntil((async () => {
    // skipIfFocused — faqat ayni shu sender'ning chat thread'i ochiq va tab focused bo'lsa
    // OS bildirishnomasini ko'rsatmaymiz. Aks holda har doim ko'rsatamiz.
    if (data.skipIfFocused && data.channel === 'chat' && data.sender_id) {
      const isCurrentChatActive = activeChatSenderId && activeChatSenderId === data.sender_id
      if (isCurrentChatActive) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        const focused = clients.find((c) => c.focused)
        if (focused) {
          clients.forEach((c) => c.postMessage({ type: 'push-skipped', payload }))
          return
        }
      }
    }
    return self.registration.showNotification(title, options)
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
