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

// Tadbir yo'naltirilgan bo'lim (ma'sul shaxsi bilan)
export interface EventDirection {
  id: string
  name_uz: string
  name_ru: string
  kind: string
  head: User | null
}

// Manzil — vazirlik binosi (zal) yoki tashqi hudud (viloyat/tuman)
export interface EventHall {
  id: number
  floor: number
  name: string
}

export interface EventLocationRef {
  id: number
  name_uz: string
  name_ru: string
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
  // "Nomidan" — yordamchi yaratsa, asl egasi (vazir/o'rinbosar)
  on_behalf_of?: User | null
  // Manzil: vazirlik binosi (hall) yoki tashqi hudud (region/district + address)
  hall?: EventHall | null
  region?: EventLocationRef | null
  district?: EventLocationRef | null
  participants: User[]
  participant_directions?: EventDirection[]
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
  // Manzil — ikki rejim: hall_id (vazirlik binosi) yoki region_id/district_id (tashqi)
  hall_id?: number | null
  region_id?: number | null
  district_id?: number | null
  // Qatnashchilar: bo'limlar (yuqori rollar) yoki odamlar (boshliqlar)
  participant_ids?: string[]
  participant_direction_ids?: string[]
  visitors?: Visitor[]
  file_ids?: string[]
  deleted_file_ids?: string[]
}
