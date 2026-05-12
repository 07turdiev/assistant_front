import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api/notifications'
import type { AppNotification } from '@/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    const { data } = await notificationsApi.count()
    unreadCount.value = data.count
  }

  async function fetchList(page = 1) {
    const { data } = await notificationsApi.list({ page })
    items.value = data.results
    return data
  }

  function pushIncoming(notification: AppNotification) {
    items.value.unshift(notification)
    unreadCount.value += 1
  }

  async function markRead(ids: string[]) {
    // WebSocket orqali kelgan vaqtinchalik bildirishnomalar (`ws-...` / `report-...`)
    // backend DB'da yo'q — UUID validation 400 beradi. Faqat real UUID'larni jo'natamiz.
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const realIds = ids.filter((id) => uuidRe.test(id))

    // Mahalliy state — har qanday id (real + vaqtinchalik) seen=true
    items.value = items.value.map((n) => (ids.includes(n.id) ? { ...n, seen: true } : n))
    unreadCount.value = Math.max(0, unreadCount.value - ids.length)

    if (realIds.length > 0) {
      await notificationsApi.markRead(realIds)
    }
  }

  async function remove(id: string) {
    await notificationsApi.delete(id)
    items.value = items.value.filter((n) => n.id !== id)
  }

  return {
    items,
    unreadCount,
    fetchUnreadCount,
    fetchList,
    pushIncoming,
    markRead,
    remove,
  }
})
