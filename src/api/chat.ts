import apiClient from './client'
import type { ChatMessage } from '@/types/chat'

export interface ChatPage {
  count: number
  next: string | null
  previous: string | null
  results: ChatMessage[]
}

export const chatApi = {
  send(payload: FormData) {
    return apiClient.post<ChatMessage>('/chat/', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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
}
