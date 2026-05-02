import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/types/chat'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Record<string, ChatMessage[]>>({})
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    const { data } = await chatApi.unreadCount()
    unreadCount.value = data.count
  }

  async function fetchHistory(receiverId: string, page = 1) {
    const { data } = await chatApi.history({ receiver_id: receiverId, page })
    messages.value[receiverId] = data.results
    return data
  }

  function pushIncoming(msg: ChatMessage) {
    const partnerId = msg.sender.id
    if (!messages.value[partnerId]) messages.value[partnerId] = []
    messages.value[partnerId].push(msg)
    if (!msg.viewed) unreadCount.value += 1
  }

  return {
    messages,
    unreadCount,
    fetchUnreadCount,
    fetchHistory,
    pushIncoming,
  }
})
