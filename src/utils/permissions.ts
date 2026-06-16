import type { RoleName } from '@/types/user'

const CAN_CREATE_EVENT: RoleName[] = [
  'VAZIR',
  'ORINBOSAR',
  'YORDAMCHI',
  'BOSHLIQ',
]

const CAN_CREATE_REPORT: RoleName[] = [
  'VAZIR',
  'ORINBOSAR',
  'YORDAMCHI',
  'BOSHLIQ',
]

const CAN_VIEW_VICE_CALENDAR: RoleName[] = ['VAZIR']

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
