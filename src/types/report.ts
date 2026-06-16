import type { User } from './user'

export type ReplyKind = 'REJECTED' | 'MUST_REJECT' | 'BY_PHONE' | 'QUICKLY' | 'EXECUTE'

// TASK — topshiriq (1:1, javobli); ANNOUNCEMENT — umumiy e'lon (hammaga/bo'limga, javobsiz)
export type ReportKind = 'TASK' | 'ANNOUNCEMENT' | 'REQUEST'

// E'lon auditoriyasi — bo'sh bo'lsa HAMMAGA
export interface ReportTargetDirection {
  id: string
  name_uz: string
  name_ru: string
}

export interface Report {
  id: string
  kind: ReportKind
  description: string
  target_directions?: ReportTargetDirection[]
  notify_time?: number | null
  reply?: ReplyKind | null
  reply_at?: string | null
  seen: boolean
  sender: User
  receiver?: User | null
  created_at: string
  updated_at: string
}
