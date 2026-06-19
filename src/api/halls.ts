import apiClient from './client'

export interface Hall {
  id: number
  floor: number
  name: string
}

export interface HallBooking {
  id: number
  hall: Hall
  date: string
  start_time: string
  end_time: string
  title: string
  event: string | null
  event_title: string
  direction_name: string
  booked_by: string
  created_at: string
}

// Zallar ro'yxati — har auth foydalanuvchi ko'ra oladi (admin emas ham)
export const hallsApi = {
  list() {
    return apiClient.get<Hall[]>('/halls/')
  },
}

export const hallBookingsApi = {
  list(params: { hall?: number; start_date?: string; end_date?: string }) {
    return apiClient.get<HallBooking[]>('/hall-bookings/', { params })
  },
  // Jonli bandlik tekshiruvi (forma uchun). exclude_event_id — tadbirni tahrirlashda o'zini istisno.
  check(payload: {
    hall_id: number
    date: string
    start_time: string
    end_time: string
    exclude_event_id?: string
  }) {
    return apiClient.post<{ available: boolean; message?: string }>('/hall-bookings/check/', payload)
  },
  create(payload: {
    hall_id: number
    date: string
    start_time: string
    end_time: string
    direction_id?: string | null
    title?: string
  }) {
    return apiClient.post<HallBooking>('/hall-bookings/', payload)
  },
  delete(id: number) {
    return apiClient.delete(`/hall-bookings/${id}/`)
  },
}
