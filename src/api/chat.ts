import apiClient from './client'
import type { ChatMessage, ChatThreadSummary } from '@/types/chat'

export interface ChatPage {
  count: number
  next: string | null
  previous: string | null
  results: ChatMessage[]
}

export const chatApi = {
  send(payload: FormData) {
    // FormData uchun Content-Type'ni qo'lda o'rnatmaymiz — browser boundary bilan
    // avtomatik qo'yadi (aks holda fayllar parse bo'lmaydi).
    return apiClient.post<ChatMessage>('/chat/', payload)
  },
  history(params: { receiver_id: string; page?: number; page_size?: number }) {
    return apiClient.get<ChatPage>('/chat/', { params })
  },
  unreadCount() {
    return apiClient.get<{ count: number }>('/chat/count/')
  },
  markRead(message_ids: string[]) {
    return apiClient.post('/chat/mark-read/', { message_ids })
  },
  /** SUPER_ADMIN — habarni soft-delete qiladi va ikki tomonga WS signal yuboradi. */
  delete(id: string) {
    return apiClient.delete<ChatMessage>(`/chat/${id}/`)
  },
  /** SUPER_ADMIN — tizimdagi barcha suhbat juftliklari (eng yangisi avval). */
  adminThreads(params: { search?: string } = {}) {
    return apiClient.get<ChatThreadSummary[]>('/chat/admin/threads/', { params })
  },
  /** SUPER_ADMIN — ikki foydalanuvchi orasidagi to'liq suhbat (o'chirilganlar ham). */
  adminConversation(params: {
    user_a: string
    user_b: string
    page?: number
    page_size?: number
  }) {
    return apiClient.get<ChatPage>('/chat/admin/conversation/', { params })
  },
}
