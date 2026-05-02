import apiClient from './client'
import type { Report } from '@/types/report'

interface PageResp<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const reportsApi = {
  create(payload: { description: string }) {
    return apiClient.post<Report>('/reports/', payload)
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
  requestsActive() {
    return apiClient.get<Report[]>('/reports/requests/active/')
  },
  requestsInactive(params?: { page?: number; page_size?: number; search?: string }) {
    return apiClient.get<PageResp<Report>>('/reports/requests/inactive/', { params })
  },
  requestsCount() {
    return apiClient.get<{ count: number }>('/reports/requests/count/')
  },
}
