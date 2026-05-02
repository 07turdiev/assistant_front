import apiClient from './client'
import type { Event, EventPayload } from '@/types/event'

export const eventsApi = {
  list(params?: { month?: string; vice_id?: string }) {
    return apiClient.get<Event[]>('/events/', { params })
  },
  byPeriod(params: { start_date: string; end_date: string; vice_id?: string }) {
    return apiClient.get<Event[]>('/events/by-period/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<Event>(`/events/${id}/`)
  },
  create(payload: FormData) {
    return apiClient.post<Event>('/events/', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update(id: string, payload: FormData) {
    return apiClient.put<Event>(`/events/${id}/`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete(id: string) {
    return apiClient.delete(`/events/${id}/`)
  },
  uploadProtocols(id: string, files: FormData) {
    return apiClient.patch(`/events/${id}/protocols/`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteProtocol(eventId: string, protocolId: string) {
    return apiClient.delete(`/events/${eventId}/protocols/${protocolId}/`)
  },
}

export type { EventPayload }
