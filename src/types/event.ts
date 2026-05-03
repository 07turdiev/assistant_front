import type { User } from './user'

export interface Visitor {
  id?: string
  full_name: string
  position: string
  organisation_name: string
}

export interface Attachment {
  id: string
  file_name: string
  content_type: string
  size: number
  url: string
}

export interface Event {
  id: string
  title: string
  description?: string
  date: string
  start_time: string
  end_time: string
  address: string
  serial_number?: string
  sphere: string
  type: string
  is_important: boolean
  is_private: boolean
  conclusion?: string
  speaker: User
  participants: User[]
  visitors: Visitor[]
  files: Attachment[]
  protocols: Attachment[]
  notify_time: number[]
  created_by_id: string
}

export interface EventPayload {
  title: string
  date: string
  start_time: string
  end_time: string
  address: string
  description?: string
  is_private?: boolean
  is_important?: boolean
  sphere: string
  type: string
  notify_time_list?: number[]
  speaker_id: string
  participant_ids: string[]
  visitors?: Visitor[]
  pre_event_id?: string
  file_ids?: string[]
  deleted_file_ids?: string[]
}
