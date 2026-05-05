import { createI18n } from 'vue-i18n'
import uz from '@/locales/uz.json'
import uzCyrl from '@/locales/uz_Cyrl.json'
import ru from '@/locales/ru.json'

export type Locale = 'uz' | 'uz-Cyrl' | 'ru'

const STORAGE_KEY = 'assistant.locale'
const VALID: Locale[] = ['uz', 'uz-Cyrl', 'ru']

export function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && (VALID as string[]).includes(stored)) return stored
  const browser = (navigator.language || '').toLowerCase()
  if (browser.startsWith('ru')) return 'ru'
  if (browser.includes('cyrl')) return 'uz-Cyrl'
  return 'uz'
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: 'uz',
  messages: {
    'uz': uz,
    'uz-Cyrl': uzCyrl,
    'ru': ru,
  },
})

document.documentElement.setAttribute('lang', i18n.global.locale.value)

export default i18n
