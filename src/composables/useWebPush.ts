import { onMounted } from 'vue'
import { useWebPushStore } from '@/stores/webpush'

export function useWebPush() {
  const store = useWebPushStore()

  onMounted(async () => {
    await store.init()
  })

  return {
    status: store.status,
    isSupported: store.isSupported,
    shouldPromptBanner: store.shouldPromptBanner,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    dismissBanner: store.dismissBanner,
    resetBanner: store.resetBanner,
  }
}
