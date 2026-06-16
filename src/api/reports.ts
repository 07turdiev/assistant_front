import apiClient from './client'
import type { Report } from '@/types/report'

interface PageResp<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const reportsApi = {
  create(payload: {
    description: string
    kind?: 'TASK' | 'ANNOUNCEMENT'
    // E'lon auditoriyasi — bo'sh/berilmasa HAMMAGA, aks holda shu bo'limlarga
    target_direction_ids?: string[]
  }) {
    // Backend bir nechta Report qaytarishi mumkin (Premier → har yordamchi uchun alohida)
    return apiClient.post<Report[]>('/reports/', payload)
  },
  reply(payload: { report_id: string; reply?: string; notify_time?: number }) {
    return apiClient.post('/reports/reply/', payload)
  },
  retrieve(id: string) {
    return apiClient.get<Report>(`/reports/${id}/`)
  },
  update(id: string, payload: Partial<Report>) {
    return apiClient.put<Report>(`/reports/${id}/`, payload)
  },
  delete(id: string) {
    return apiClient.delete(`/reports/${id}/`)
  },

  tasksActive() {
    return apiClient.get<Report[]>('/reports/tasks/active/')
  },
  tasksInactive(params?: { page?: number; page_size?: number; search?: string }) {
    return apiClient.get<PageResp<Report>>('/reports/tasks/inactive/', { params })
  },
  tasksCount() {
    return apiClient.get<{ count: number }>('/reports/tasks/count/')
  },
  // Umumiy e'lonlar — hammaga ko'rinadi
  announcements(params?: { page?: number; page_size?: number; search?: string }) {
    return apiClient.get<PageResp<Report>>('/reports/announcements/', { params })
  },
  announcementsCount() {
    return apiClient.get<{ count: number }>('/reports/announcements/count/')
  },
}
