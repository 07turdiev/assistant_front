import apiClient from './client'

export interface PreEvent {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  created_at: string
  created_by?: string | null
}

export interface PreEventPayload {
  title: string
  description?: string
  date: string
  start_time: string
  end_time: string
}

interface PageResp<T> {
  count: number
  results: T[]
}

export const preEventsApi = {
  list(params?: { page?: number; page_size?: number }) {
    return apiClient.get<PageResp<PreEvent>>('/pre-events/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<PreEvent>(`/pre-events/${id}/`)
  },
  create(payload: PreEventPayload) {
    return apiClient.post<PreEvent>('/pre-events/', payload)
  },
  update(id: string, payload: PreEventPayload) {
    return apiClient.put<PreEvent>(`/pre-events/${id}/`, payload)
  },
  delete(id: string) {
    return apiClient.delete(`/pre-events/${id}/`)
  },
}
