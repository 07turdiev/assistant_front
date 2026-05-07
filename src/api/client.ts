import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/** Maxsus axios config flaglar — chaqiruvchi xato ko'rinishini boshqarishi mumkin. */
export interface ApiRequestExtras {
  /** True bo'lsa — global error toast ko'rsatilmaydi (chaqiruvchi o'zi handle qiladi). */
  silent?: boolean
  /** Ma'lum status code'lar uchun toast ko'rsatmaslik (masalan 404 — yumshoq UX uchun). */
  suppressStatuses?: number[]
}

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AxiosRequestConfig extends ApiRequestExtras {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface InternalAxiosRequestConfig extends ApiRequestExtras {}
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

/** Status'ni ko'rib, foydalanuvchiga avtomatik xabar ko'rsatish kerakmi qaror qiladi. */
function shouldShowError(error: AxiosError): boolean {
  const cfg = error.config as RetryConfig | undefined
  if (cfg?.silent) return false

  const status = error.response?.status
  if (status && cfg?.suppressStatuses?.includes(status)) return false

  // 401 — refresh paytida hech narsa ko'rsatmaymiz, refresh muvaffaqiyatsiz bo'lsa
  // session-expired flow alohida kechiriladi (auth store).
  if (status === 401) return false

  return true
}

async function showGlobalError(error: AxiosError): Promise<void> {
  // Dinamik import — circular dependency va kechki yuklanish uchun
  const { showApiError } = await import('@/utils/api-error')
  showApiError(error)
  // Marker — keyingi qo'lda showApiError chaqirilsa, yana takrorlamaydi
  ;(error as { __handledGlobally?: boolean }).__handledGlobally = true
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as RetryConfig | undefined

    // 401 → refresh va qayta urinib ko'rish
    if (status === 401 && original && !original._retry) {
      const url = original.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        // Login/refresh xatosi — silent bo'lmasa toast
        if (shouldShowError(error)) await showGlobalError(error)
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

    // Boshqa har qanday xato — global toast (silent bo'lmasa)
    if (shouldShowError(error)) {
      await showGlobalError(error)
    }

    return Promise.reject(error)
  }
)

export default apiClient
