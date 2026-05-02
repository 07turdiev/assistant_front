import { createI18n } from 'vue-i18n'
import uz from '@/locales/uz.json'
import ru from '@/locales/ru.json'

export type Locale = 'uz' | 'ru'

const STORAGE_KEY = 'assistant.locale'

export function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'uz' || stored === 'ru') return stored
  const browser = navigator.language?.toLowerCase() || ''
  if (browser.startsWith('ru')) return 'ru'
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
  messages: { uz, ru },
})

document.documentElement.setAttribute('lang', i18n.global.locale.value)

export default i18n
