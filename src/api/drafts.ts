import apiClient from './client'
import type {
  EventDraft,
  EventDraftUpdate,
  ReportDraft,
  ReportDraftUpdate,
} from '@/types/draft'
import type { Event } from '@/types/event'

export interface DraftListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const eventDraftsApi = {
  list(params?: { page?: number; page_size?: number; status?: string }) {
    return apiClient.get<DraftListResponse<EventDraft>>('/drafts/events/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<EventDraft>(`/drafts/events/${id}/`)
  },
  update(id: string, payload: EventDraftUpdate) {
    return apiClient.patch<EventDraft>(`/drafts/events/${id}/`, payload)
  },
  publish(id: string) {
    return apiClient.post<{ draft: EventDraft; event: Event }>(`/drafts/events/${id}/publish/`)
  },
  reject(id: string, reason?: string) {
    return apiClient.post<EventDraft>(`/drafts/events/${id}/reject/`, { reason })
  },
  delete(id: string) {
    return apiClient.delete(`/drafts/events/${id}/`)
  },
}

export const reportDraftsApi = {
  list(params?: { page?: number; page_size?: number; status?: string }) {
    return apiClient.get<DraftListResponse<ReportDraft>>('/drafts/reports/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<ReportDraft>(`/drafts/reports/${id}/`)
  },
  update(id: string, payload: ReportDraftUpdate) {
    return apiClient.patch<ReportDraft>(`/drafts/reports/${id}/`, payload)
  },
  publish(id: string) {
    return apiClient.post<{ draft: ReportDraft; report: unknown }>(
      `/drafts/reports/${id}/publish/`,
    )
  },
  reject(id: string, reason?: string) {
    return apiClient.post<ReportDraft>(`/drafts/reports/${id}/reject/`, { reason })
  },
  delete(id: string) {
    return apiClient.delete(`/drafts/reports/${id}/`)
  },
}
