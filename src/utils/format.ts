import type { User } from '@/types/user'

export function fullName(user?: User | null): string {
  if (!user) return ''
  return `${user.last_name} ${user.first_name} ${user.father_name || ''}`.trim()
}

export function shortName(user?: User | null): string {
  if (!user) return ''
  const initials = [user.first_name?.[0], user.father_name?.[0]]
    .filter(Boolean)
    .map((c) => `${c}.`)
    .join('')
  return `${user.last_name} ${initials}`.trim()
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`
  }
  return phone
}
