import type { User } from './user'
import type { Attachment } from './event'

export interface ChatMessage {
  id: string
  message: string
  viewed: boolean
  sender: User
  receiver: User
  files: Attachment[]
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
  deleted_by?: User | null
}

export interface ChatThreadSummary {
  user_a: User
  user_b: User
  last_message_at: string | null
  total: number
}
