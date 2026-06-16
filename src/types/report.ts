import type { User } from './user'

export type ReplyKind = 'REJECTED' | 'MUST_REJECT' | 'BY_PHONE' | 'QUICKLY' | 'EXECUTE'

// TASK — topshiriq (1:1, javobli); ANNOUNCEMENT — umumiy e'lon (hammaga, javobsiz)
export type ReportKind = 'TASK' | 'ANNOUNCEMENT' | 'REQUEST'

export interface Report {
  id: string
  kind: ReportKind
  description: string
  notify_time?: number | null
  reply?: ReplyKind | null
  reply_at?: string | null
  seen: boolean
  sender: User
  receiver?: User | null
  created_at: string
  updated_at: string
}
