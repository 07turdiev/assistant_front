import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'

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
  const path = import.meta.env.VITE_WS_URL || '/ws/'
  if (path.startsWith('ws://') || path.startsWith('wss://')) return path
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}${path}`
}

export function useAppWebSocket() {
  const auth = useAuthStore()
  const notificationsStore = useNotificationsStore()
  const chatStore = useChatStore()

  const isConnected = ref(false)

  function handleMessage(payload: BasePayload) {
    switch (payload.channel) {
      case 'notify':
        notificationsStore.pushIncoming({
          id: `ws-${Date.now()}`,
          user_id: auth.user?.id || '',
          title: (payload.title as string) || 'Bildirishnoma',
          notification_type: (payload.type as never) || 'NEW',
          event_id: (payload.event_id as string) || null,
          is_important: Boolean(payload.is_important),
          seen: false,
          created_at: new Date().toISOString(),
        } as never)
        break
      case 'chat':
        chatStore.pushIncoming(payload as never)
        break
      case 'report':
        notificationsStore.pushIncoming({
          id: `report-${Date.now()}`,
          user_id: auth.user?.id || '',
          title: (payload.message as string) || 'Hisobot',
          notification_type: 'NEW',
          is_important: false,
          seen: false,
          created_at: new Date().toISOString(),
        } as never)
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
