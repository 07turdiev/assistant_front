export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'VAZIR'
  | 'ORINBOSAR'
  | 'YORDAMCHI'
  | 'BOSHLIQ'
  | 'XODIM'

export type UserStatus =
  | 'AT_WORK'
  | 'ON_HOLIDAY'
  | 'WORK_TRIP'
  | 'DISMISSED'
  | 'IN_CHILDHOOD_RAISING'

export interface Role {
  id: number
  name: RoleName
  label_uz: string
  label_ru: string
}

export interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  father_name?: string
  position_uz?: string
  position_ru?: string
  phone_number?: string
  email?: string
  office_number?: string
  enabled: boolean
  status: UserStatus
  role: Role
  direction_id?: string
  organisation_id?: string
  chief_id?: string | null
  avatar_url?: string | null
  telegram_id?: number | null
}

// Yordamchining rahbari — "[rahbar] nomidan" banneri uchun qisqa ma'lumot
export interface ChiefInfo {
  id: string
  first_name: string
  last_name: string
  father_name?: string
  position_uz?: string
  position_ru?: string
  role_label_uz?: string
  role_label_ru?: string
}

export interface UserMe extends User {
  position?: string
  // Faqat YORDAMCHI uchun to'ldiriladi (rahbar nomidan ish yuritadi)
  chief?: ChiefInfo | null
}

export interface UserShort {
  id: string
  username: string
  first_name: string
  last_name: string
  father_name?: string | null
  position_uz?: string | null
  position_ru?: string | null
  avatar_url?: string | null
}
