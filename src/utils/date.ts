import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ru'

dayjs.extend(relativeTime)

const TZ = 'Asia/Tashkent'

export function formatDate(value: string | Date | undefined, format = 'DD.MM.YYYY'): string {
  if (!value) return ''
  return dayjs(value).tz(TZ).format(format)
}

export function formatDateTime(value: string | Date | undefined, format = 'DD.MM.YYYY HH:mm'): string {
  if (!value) return ''
  return dayjs(value).tz(TZ).format(format)
}

export function formatTime(value: string | Date | undefined, format = 'HH:mm'): string {
  if (!value) return ''
  return dayjs(value).tz(TZ).format(format)
}

export function fromNow(value: string | Date | undefined): string {
  if (!value) return ''
  return dayjs(value).tz(TZ).fromNow()
}
