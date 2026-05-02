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
}
