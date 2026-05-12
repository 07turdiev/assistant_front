import apiClient from './client'
import type { User, UserMe } from '@/types/user'

export const usersApi = {
  me() {
    return apiClient.get<UserMe>('/users/me/')
  },
  updateMe(data: FormData | Partial<UserMe>) {
    // Diqqat: FormData uchun Content-Type'ni qo'lda o'rnatmaymiz — aks holda
    // boundary qo'shilmay qoladi va backend faylni (avatar) parse qila olmaydi.
    // Axios/browser uni avtomatik to'g'ri boundary bilan qo'yadi.
    return apiClient.put<UserMe>('/users/me/', data)
  },
  changePassword(payload: { old_password: string; new_password: string }) {
    return apiClient.patch('/users/me/password/', payload)
  },
  list(params?: Record<string, unknown>) {
    return apiClient.get<{ count: number; results: User[] }>('/users/', { params })
  },
  participants(params?: {
    direction_id?: string
    organisation_id?: string
    chief_id?: string
    search?: string
  }) {
    return apiClient.get<User[]>('/users/participants/', { params })
  },
  subordinates(userId: string) {
    return apiClient.get<User[]>(`/users/${userId}/subordinates/`)
  },
  chatters() {
    return apiClient.get<User[]>('/users/chatters/')
  },
  vice() {
    return apiClient.get<User[]>('/users/vice/')
  },
  fullInfo(id: string) {
    return apiClient.get<User>(`/users/${id}/full/`)
  },
  chiefCandidates(params: { direction_id: string; exclude?: string }) {
    return apiClient.get<User[]>('/users/chief-candidates/', { params })
  },
}
