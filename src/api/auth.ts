import apiClient from './client'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message?: string
}

export const authApi = {
  login(payload: LoginPayload) {
    return apiClient.post<LoginResponse>('/auth/login/', payload)
  },
  logout() {
    return apiClient.post('/auth/logout/')
  },
  refresh() {
    return apiClient.post('/auth/refresh/')
  },
}
