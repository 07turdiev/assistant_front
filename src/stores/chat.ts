import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/types/chat'

interface IncomingWSPayload {
  channel: 'chat'
  from: string
  message_id: string
  message: string
  created_at: string
  echo?: boolean
}

export const useChatStore = defineStore('chat', () => {
  /** Chat xabarlari (partner_id → message[]). To'liq ChatMessage'lar history fetch'dan keladi. */
  const messages = ref<Record<string, ChatMessage[]>>({})
  const unreadCount = ref(0)
  /** Sender bo'yicha guruhlangan unread count. */
  const unreadBySender = ref<Record<string, number>>({})

  /** WS push'dan kelgan yangi xabarlar — to'liq ChatMessage shaklida emas, faqat eslatma uchun. */
  const recentIncoming = ref<IncomingWSPayload[]>([])

  async function fetchUnreadCount() {
    const { data } = await chatApi.unreadCount()
    const d = data as { count: number; by_sender?: { sender_id: string; count: number }[] }
    unreadCount.value = d.count
    const map: Record<string, number> = {}
    if (d.by_sender) for (const it of d.by_sender) map[it.sender_id] = it.count
    unreadBySender.value = map
  }

  async function fetchHistory(receiverId: string, page = 1) {
    const { data } = await chatApi.history({ receiver_id: receiverId, page })
    messages.value[receiverId] = data.results
    return data
  }

  /** WS chat payload'ni qabul qilib, ko'rsatkichlarni yangilash. */
  function pushIncoming(payload: IncomingWSPayload) {
    if (payload.echo) {
      // O'zining yuborgan xabari — count'ga qo'shilmaydi
      recentIncoming.value.push(payload)
      return
    }
    recentIncoming.value.push(payload)
    unreadCount.value += 1
    const fromId = payload.from
    unreadBySender.value[fromId] = (unreadBySender.value[fromId] || 0) + 1
  }

  function clearRecent() {
    recentIncoming.value = []
  }

  return {
    messages,
    unreadCount,
    unreadBySender,
    recentIncoming,
    fetchUnreadCount,
    fetchHistory,
    pushIncoming,
    clearRecent,
  }
})
