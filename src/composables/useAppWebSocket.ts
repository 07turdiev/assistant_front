import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'
import { useRealtimeStore } from '@/stores/realtime'

interface BasePayload {
  channel: 'chat' | 'notify' | 'report' | 'presence' | 'pong'
  [key: string]: unknown
}

let sharedSocket: WebSocket | null = null
let reconnectTimer: number | null = null
let pingTimer: number | null = null
let manuallyClosed = false
const RECONNECT_DELAY_MS = 3000
const PING_INTERVAL_MS = 30000

function buildWsUrl(): string {
  let path = import.meta.env.VITE_WS_URL || '/ws/'
  if (path.startsWith('ws://') || path.startsWith('wss://')) return path
  // Nginx odatda `/ws/` bo'yicha lokatsiya yozadi — slashsiz so'rov SPA fallback'iga
  // tushib qoladi va WebSocket handshake fail bo'ladi. Shuning uchun trailing slash majbur.
  if (!path.endsWith('/')) path = path + '/'
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}${path}`
}

export function useAppWebSocket() {
  const auth = useAuthStore()
  const notificationsStore = useNotificationsStore()
  const chatStore = useChatStore()
  const realtimeStore = useRealtimeStore()

  const isConnected = ref(false)

  function handleMessage(payload: BasePayload) {
    switch (payload.channel) {
      case 'notify':
        // Optimistik: badge va ro'yxat darrov yangilanadi (realtime his-tuyg'u uchun).
        notificationsStore.pushIncoming({
          id: `ws-${Date.now()}`,
          user_id: auth.user?.id || '',
          title: (payload.title as string) || 'Bildirishnoma',
          notification_type: (payload.type as never) || 'NEW',
          event_id: (payload.event_id as string) || null,
          report_id: (payload.report_id as string) || null,
          is_important: Boolean(payload.is_important),
          seen: false,
          created_at: new Date().toISOString(),
        } as never)
        // ...so'ng badge'ni backend haqiqatiga moslaymiz (optimistik +1 ikki-karra
        // sanalmasligi va fantom qolmasligi uchun authoritative count).
        notificationsStore.fetchUnreadCount().catch(() => undefined)
        // Realtime: tegishli ko'rinishni jonli yangilash
        if (payload.type === 'ANNOUNCEMENT') {
          realtimeStore.bumpAnnouncements()
        } else if (payload.event_id) {
          realtimeStore.bumpEvents()
        }
        break
      case 'chat':
        chatStore.pushIncoming(payload as never)
        break
      case 'report':
        // Hisobot eslatmasi — DB bildirishnomasi EMAS (faqat real-time eslatma).
        // Badge'ni soxta oshirmaymiz (aks holda «1» qoladi-yu ro'yxat bo'sh bo'ladi);
        // o'rniga foydalanuvchiga toast ko'rsatamiz.
        ElNotification({
          title: 'Eslatma',
          message: (payload.message as string) || 'Hisobot eslatmasi',
          type: 'warning',
          duration: 6000,
        })
        break
      default:
        break
    }
  }

  function send(data: object) {
    if (sharedSocket?.readyState === WebSocket.OPEN) {
      sharedSocket.send(JSON.stringify(data))
    }
  }

  function connect() {
    if (!auth.isAuthenticated) return
    if (sharedSocket && (sharedSocket.readyState === WebSocket.OPEN || sharedSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    manuallyClosed = false
    sharedSocket = new WebSocket(buildWsUrl())

    sharedSocket.addEventListener('open', () => {
      isConnected.value = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (pingTimer) clearInterval(pingTimer)
      pingTimer = window.setInterval(() => send({ channel: 'ping' }), PING_INTERVAL_MS)
    })

    sharedSocket.addEventListener('message', (e) => {
      try {
        const payload: BasePayload = JSON.parse(e.data)
        handleMessage(payload)
      } catch (err) {
        console.warn('Bad WS payload:', err)
      }
    })

    sharedSocket.addEventListener('close', () => {
      isConnected.value = false
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
      if (!manuallyClosed && auth.isAuthenticated) {
        reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS)
      }
    })

    sharedSocket.addEventListener('error', () => {
      sharedSocket?.close()
    })
  }

  function disconnect() {
    manuallyClosed = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    sharedSocket?.close()
    sharedSocket = null
    isConnected.value = false
  }

  onMounted(() => {
    if (auth.isAuthenticated) connect()
  })

  watch(
    () => auth.isAuthenticated,
    (val) => {
      if (val) connect()
      else disconnect()
    }
  )

  onBeforeUnmount(() => {
    // umumiy socket — boshqa view'lar foydalansin, faqat shared'ni saqlab turamiz
  })

  return { isConnected, send, connect, disconnect }
}
