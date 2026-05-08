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
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    // Har qanday chat push'da ochiq tab'larga signal beramiz — sayt unread badge'ni
    // darhol yangilashi uchun. WebSocket ishlamasa ham raqam jonli yangilanadi.
    if (data.channel === 'chat') {
      clientList.forEach((c) => c.postMessage({ type: 'chat-push', payload }))
    }

    // skipIfFocused — faqat ayni shu sender'ning chat thread'i ochiq va tab focused bo'lsa
    // OS bildirishnomasini ko'rsatmaymiz. Aks holda har doim ko'rsatamiz.
    if (data.skipIfFocused && data.channel === 'chat' && data.sender_id) {
      const isCurrentChatActive = activeChatSenderId && activeChatSenderId === data.sender_id
      if (isCurrentChatActive) {
        const focused = clientList.find((c) => c.focused)
        if (focused) {
          clientList.forEach((c) => c.postMessage({ type: 'push-skipped', payload }))
          return
        }
      }
    }
    return self.registration.showNotification(title, options)
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const targetUrl = data.url || '/'
  const isChat = data.channel === 'chat'
  const senderId = data.sender_id

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    if (clientList.length > 0) {
      // Mavjud ochiq tab bor — sahifani o'zgartirmaymiz, faqat focus + signal yuboramiz.
      // Chat uchun esa client tomonida o'sha thread ochiladi (router'ga teginmaymiz).
      const target = clientList.find((c) => c.focused) || clientList[0]
      if (isChat && senderId) {
        target.postMessage({ type: 'open-chat', senderId })
      } else if (targetUrl && targetUrl !== '/') {
        // Chat'dan boshqa bildirishnomalar uchun — odatdagidek yo'naltiramiz
        try { target.navigate(targetUrl) } catch (_e) { /* navigate ba'zida block bo'ladi */ }
      }
      return target.focus()
    }
    // Hech qaysi tab ochiq emas — yangi oyna ochamiz (chat bo'lsa ?openChat=… orqali)
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl)
    }
  })())
})
