export type NotificationKind = 'NEW' | 'EDITED' | 'DELETED' | 'REMINDED' | 'PRE_EVENT'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  notification_type: NotificationKind
  event_id?: string | null
  pre_event_id?: string | null
  date?: string | null
  start_time?: string | null
  end_time?: string | null
  is_important: boolean
  seen: boolean
  created_at: string
}
