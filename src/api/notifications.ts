import apiClient from './client'
import type { AppNotification } from '@/types/notification'

export interface NotifyPage {
  count: number
  next: string | null
  previous: string | null
  results: AppNotification[]
}

export const notificationsApi = {
  list(params?: { page?: number; page_size?: number }) {
    return apiClient.get<NotifyPage>('/notifications/', { params })
  },
  count() {
    return apiClient.get<{ count: number }>('/notifications/count/')
  },
  delete(id: string) {
    return apiClient.delete(`/notifications/${id}/`)
  },
  bulkDelete(ids: string[]) {
    return apiClient.post('/notifications/bulk-delete/', { ids })
  },
  markRead(ids: string[]) {
    return apiClient.post('/notifications/mark-read/', { ids })
  },
}
