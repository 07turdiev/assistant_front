import type { RoleName } from '@/types/user'

const CAN_CREATE_EVENT: RoleName[] = [
  'PREMIER_MINISTER',
  'VICE_MINISTER',
  'ASSISTANT_PREMIER',
  'HEAD',
  'ASSISTANT',
]

const CAN_CREATE_REPORT: RoleName[] = [
  'PREMIER_MINISTER',
  'ASSISTANT_PREMIER',
  'HEAD',
  'ASSISTANT',
]

const CAN_VIEW_VICE_CALENDAR: RoleName[] = ['PREMIER_MINISTER']

export function canCreateEvent(role: RoleName | null): boolean {
  return role !== null && CAN_CREATE_EVENT.includes(role)
}

export function canCreateReport(role: RoleName | null): boolean {
  return role !== null && CAN_CREATE_REPORT.includes(role)
}

export function canViewViceCalendar(role: RoleName | null): boolean {
  return role !== null && CAN_VIEW_VICE_CALENDAR.includes(role)
}

export function canEditOwnEvent(role: RoleName | null, isOwner: boolean): boolean {
  if (!isOwner) return false
  return canCreateEvent(role)
}
