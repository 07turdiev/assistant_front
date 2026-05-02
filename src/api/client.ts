import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
})

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh/`, null, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as RetryConfig | undefined

    if (status === 401 && original && !original._retry) {
      const url = original.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }
      original._retry = true
      try {
        await refreshAccessToken()
        return apiClient(original)
      } catch (refreshErr) {
        const { useAuthStore } = await import('@/stores/auth')
        useAuthStore().handleSessionExpired()
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
