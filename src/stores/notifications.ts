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

  // Badge + ro'yxatni bitta authoritative manbadan (backend) sinxron yangilaydi.
  // Fantom hisob (persistent bo'lmagan `report` WS yoki ulanish uzilishidan)
  // shu yerda backend haqiqatiga qaytib tuzatiladi.
  async function refresh() {
    await Promise.allSettled([fetchUnreadCount(), fetchList(1)])
  }

  function pushIncoming(notification: AppNotification) {
    items.value.unshift(notification)
    unreadCount.value += 1
  }

  async function markRead(ids: string[]) {
    if (ids.length === 0) return
    await notificationsApi.markRead(ids)
    items.value = items.value.map((n) => (ids.includes(n.id) ? { ...n, seen: true } : n))
    // Optimistik kamaytirish, so'ng backend haqiqatiga moslash —
    // sahifalangan (PAGE_SIZE=20) ro'yxatda badge drift bermasligi uchun.
    unreadCount.value = Math.max(0, unreadCount.value - ids.length)
    await fetchUnreadCount().catch(() => undefined)
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
    refresh,
    pushIncoming,
    markRead,
    remove,
  }
})
