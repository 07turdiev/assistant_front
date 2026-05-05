import type { UserShort } from './user'

export type DraftStatus = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'EXPIRED'
export type DraftSource = 'VOICE_TELEGRAM' | 'MANUAL'

export interface BaseDraft {
  id: string
  title: string
  description: string
  status: DraftStatus
  is_important: boolean
  notify_minutes_before: number[]
  assigned_to: UserShort | null
  target_direction: string | null
  target_direction_name: string | null
  suggested_participants: UserShort[]
  unresolved_participant_names: string[]
  source: DraftSource
  raw_transcript: string
  voice_file_url: string | null
  created_by: UserShort | null
  created_at: string
  updated_at: string
  published_at: string | null
  rejected_reason: string
}

export interface EventDraft extends BaseDraft {
  date: string | null
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  location: string
  is_private: boolean
  sphere: string
  event_type: string
  speaker: UserShort | null
  published_event: string | null
}

export interface ReportDraft extends BaseDraft {
  deadline_text: string
  published_report: string | null
}

export interface EventDraftUpdate {
  title?: string
  description?: string
  date?: string | null
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  location?: string
  is_important?: boolean
  is_private?: boolean
  sphere?: string
  event_type?: string
  speaker?: string | null
  assigned_to?: string | null
  suggested_participants?: string[]
  notify_minutes_before?: number[]
}

export interface ReportDraftUpdate {
  title?: string
  description?: string
  is_important?: boolean
  deadline_text?: string
  assigned_to?: string | null
  suggested_participants?: string[]
  notify_minutes_before?: number[]
}
