import apiClient from './client'
import type { User, UserMe } from '@/types/user'

export const usersApi = {
  me() {
    return apiClient.get<UserMe>('/users/me/')
  },
  updateMe(data: FormData | Partial<UserMe>) {
    const isForm = data instanceof FormData
    return apiClient.put<UserMe>('/users/me/', data, {
      headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
  },
  changePassword(payload: { old_password: string; new_password: string }) {
    return apiClient.patch('/users/me/password/', payload)
  },
  list(params?: Record<string, unknown>) {
    return apiClient.get<{ count: number; results: User[] }>('/users/', { params })
  },
  participants(params: Record<string, unknown>) {
    return apiClient.get<User[]>('/users/participants/', { params })
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
}
