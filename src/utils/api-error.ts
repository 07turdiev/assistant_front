import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'

type ErrorBody =
  | string
  | string[]
  | Record<string, unknown>
  | null
  | undefined

export interface ExtractOptions {
  fallback?: string
  fieldLabels?: Record<string, string>
}

const SKIP_KEYS = new Set(['code', 'status_code'])

function flatten(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  }
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)]
  if (Array.isArray(value)) return value.flatMap(flatten)
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flatten)
  return []
}

function formatFieldMap(obj: Record<string, unknown>, fieldLabels?: Record<string, string>): string {
  const lines: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    if (SKIP_KEYS.has(key)) continue
    const msgs = flatten(val)
    if (!msgs.length) continue
    if (key === 'non_field_errors' || key === 'detail' || key === 'message' || key === 'error') {
      lines.push(...msgs)
    } else {
      // Xom kalit (masalan "end_time") foydalanuvchiga ko'rsatilmaydi — backend xabarlari
      // o'zi tushunarli. Faqat inson-o'qiydigan label berilgan bo'lsa prefiks qo'shamiz.
      const label = fieldLabels?.[key]
      lines.push(label ? `${label}: ${msgs.join(', ')}` : msgs.join(', '))
    }
  }
  return lines.join('\n')
}

function fromBody(body: ErrorBody, fieldLabels?: Record<string, string>): string {
  if (body == null) return ''
  if (typeof body === 'string') return body.trim()
  if (Array.isArray(body)) return flatten(body).join('\n')
  if (typeof body !== 'object') return String(body)

  const obj = body as Record<string, unknown>

  // 1) Strukturali field xatolari — eng aniq/foydali. Generic `message`dan OLDIN tekshiramiz:
  //    backend ko'pincha {message:"Validation error", errors:{field:[...]}} qaytaradi —
  //    aks holda faqat "Validation error" ko'rinib, asl sabab (masalan "Tugash vaqti...")
  //    yashirin qolardi.
  const nested = obj.errors
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const formatted = formatFieldMap(nested as Record<string, unknown>, fieldLabels)
    if (formatted) return formatted
  }
  if (typeof nested === 'string' && nested.trim()) return nested.trim()

  // 2) Bitta umumiy xabar (DRF {detail}, yoki backend {message}/{error})
  for (const key of ['detail', 'message', 'error'] as const) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }

  // 3) Wrapper'siz field-map (masalan DRF standart {field: [msg]})
  return formatFieldMap(obj, fieldLabels)
}

export function extractApiError(err: unknown, options: ExtractOptions | string = {}): string {
  const opts = typeof options === 'string' ? { fallback: options } : options
  const fallback = opts.fallback ?? 'Xatolik yuz berdi'

  if (!err || typeof err !== 'object') return fallback

  const ax = err as AxiosError

  if (ax.response?.data) {
    const msg = fromBody(ax.response.data as ErrorBody, opts.fieldLabels)
    if (msg) return msg
  }

  const status = ax.response?.status
  if (status === 401) return fallback
  if (status === 403) return opts.fallback ?? "Ruxsat yo'q"
  if (status === 404) return opts.fallback ?? 'Topilmadi'
  if (status === 413) return opts.fallback ?? 'Fayl hajmi katta'

  if (ax.code === 'ECONNABORTED') return opts.fallback ?? 'Vaqt tugadi (timeout)'
  if (ax.request && !ax.response) return opts.fallback ?? 'Internet aloqasi mavjud emas'

  if (typeof ax.message === 'string' && ax.message) return ax.message

  return fallback
}

export function showApiError(err: unknown, options: ExtractOptions | string = {}): void {
  // Global axios interceptor allaqachon ko'rsatgan bo'lsa — takrorlamaymiz
  if (err && typeof err === 'object' && (err as { __handledGlobally?: boolean }).__handledGlobally) {
    return
  }
  const msg = extractApiError(err, options)
  if (msg.includes('\n')) {
    // Multi-line: ; bilan birlashtiramiz (HTML ishlatmaymiz — XSS oldini olish uchun)
    ElMessage({
      type: 'error',
      message: msg.replace(/\n+/g, ' · '),
      duration: 6000,
      showClose: true,
    })
  } else {
    ElMessage.error({ message: msg, showClose: true })
  }
}
