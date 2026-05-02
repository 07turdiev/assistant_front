import apiClient from './client'

export interface WebPushSubscription {
  id: string
  endpoint: string
  user_agent?: string
  last_used_at?: string | null
  created_at: string
}

export interface SubscribePayload {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user_agent?: string
}

export const webpushApi = {
  vapidPublicKey() {
    return apiClient.get<{ public_key: string }>('/webpush/vapid-public-key/')
  },
  subscribe(payload: SubscribePayload) {
    return apiClient.post<WebPushSubscription>('/webpush/subscribe/', payload)
  },
  unsubscribe(id: string) {
    return apiClient.delete(`/webpush/subscribe/${id}/`)
  },
  list() {
    return apiClient.get<WebPushSubscription[]>('/webpush/subscriptions/')
  },
  test() {
    return apiClient.post('/webpush/test/')
  },
}
