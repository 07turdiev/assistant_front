import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { webpushApi, type WebPushSubscription } from '@/api/webpush'

const DISMISSED_KEY = 'assistant.webpush.dismissed'

export type WebPushStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'subscribing' | 'subscribed'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

function bufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return ''
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const useWebPushStore = defineStore('webpush', () => {
  const status = ref<WebPushStatus>('default')
  const subscriptions = ref<WebPushSubscription[]>([])
  const isSupported = ref(false)

  const dismissed = ref<boolean>(localStorage.getItem(DISMISSED_KEY) === '1')

  const shouldPromptBanner = computed(() => {
    return isSupported.value && status.value === 'default' && !dismissed.value
  })

  async function init() {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!isSupported.value) {
      status.value = 'unsupported'
      return
    }
    status.value = Notification.permission as WebPushStatus
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) status.value = 'subscribed'
    } catch (_e) {
      // ignore
    }
  }

  async function subscribe(): Promise<void> {
    if (!isSupported.value) throw new Error('Web Push not supported')
    status.value = 'subscribing'

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      status.value = permission as WebPushStatus
      return
    }

    const { data } = await webpushApi.vapidPublicKey()
    const reg = await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    })

    const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string }; endpoint?: string }
    await webpushApi.subscribe({
      endpoint: sub.endpoint,
      keys: {
        p256dh: json.keys?.p256dh ?? bufferToBase64(sub.getKey('p256dh')),
        auth: json.keys?.auth ?? bufferToBase64(sub.getKey('auth')),
      },
      user_agent: navigator.userAgent,
    })

    status.value = 'subscribed'
  }

  async function unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      try {
        const list = await webpushApi.list()
        for (const s of list.data) {
          if (s.endpoint === sub.endpoint) await webpushApi.unsubscribe(s.id)
        }
      } catch (_e) {
        // ignore — sub allaqachon o'chirilgan bo'lishi mumkin
      }
    }
    status.value = (Notification.permission as WebPushStatus) || 'default'
  }

  async function fetchSubscriptions() {
    const { data } = await webpushApi.list()
    subscriptions.value = data
  }

  function dismissBanner() {
    dismissed.value = true
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  function resetBanner() {
    dismissed.value = false
    localStorage.removeItem(DISMISSED_KEY)
  }

  return {
    status,
    isSupported,
    subscriptions,
    dismissed,
    shouldPromptBanner,
    init,
    subscribe,
    unsubscribe,
    fetchSubscriptions,
    dismissBanner,
    resetBanner,
  }
})
