import apiClient from './client'
import type { Event, EventPayload } from '@/types/event'

export const eventsApi = {
  /** Standart paginatsiyali list (admin/monitoring uchun). */
  list(params?: { page?: number; page_size?: number; search?: string }) {
    return apiClient.get<{ count: number; results: Event[] }>('/events/', { params })
  },
  /** Oylik kalendar (production: GET /api/event/all?month=M-yyyy). */
  byMonth(params: { month: string; vice_id?: string }) {
    return apiClient.get<Event[]>('/events/all/', { params })
  },
  /** Diapazon bo'yicha kalendar (production: GET /api/event/all/by-period). */
  byPeriod(params: { start_date: string; end_date: string; vice_id?: string }) {
    return apiClient.get<Event[]>('/events/all/by-period/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<Event>(`/events/${id}/`)
  },
  create(payload: FormData) {
    // FormData uchun Content-Type'ni qo'lda o'rnatmaymiz — browser boundary bilan
    // avtomatik qo'yadi (aks holda fayllar parse bo'lmaydi).
    return apiClient.post<Event>('/events/', payload)
  },
  update(id: string, payload: FormData) {
    return apiClient.put<Event>(`/events/${id}/`, payload)
  },
  delete(id: string) {
    return apiClient.delete(`/events/${id}/`)
  },
  uploadProtocols(id: string, files: FormData) {
    return apiClient.patch(`/events/${id}/protocols/`, files)
  },
  deleteProtocol(eventId: string, protocolId: string) {
    return apiClient.delete(`/events/${eventId}/protocols/${protocolId}/`)
  },
  // Delegatsiya — boshliq tadbirni o'z quyi xodimlari yoki quyi bo'limlariga yo'naltiradi
  forward(id: string, payload: { subordinate_ids?: string[]; direction_ids?: string[] }) {
    return apiClient.post<{ success: boolean; added: number; message: string }>(
      `/events/${id}/forward/`,
      payload,
    )
  },
}

export type { EventPayload }
