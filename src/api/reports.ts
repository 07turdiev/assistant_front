import apiClient from './client'
import type { Report } from '@/types/report'

interface PageResp<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Reports moduli endi faqat umumiy e'lonlar uchun (Topshiriq olib tashlandi)
export const reportsApi = {
  create(payload: {
    description: string
    // E'lon auditoriyasi — bo'sh/berilmasa HAMMAGA, aks holda shu bo'limlarga
    target_direction_ids?: string[]
  }) {
    return apiClient.post<Report[]>('/reports/', payload)
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

  // Umumiy e'lonlar — auditoriya bo'yicha ko'rinadi
  announcements(params?: { page?: number; page_size?: number; search?: string }) {
    return apiClient.get<PageResp<Report>>('/reports/announcements/', { params })
  },
  announcementsCount() {
    return apiClient.get<{ count: number }>('/reports/announcements/count/')
  },
}
