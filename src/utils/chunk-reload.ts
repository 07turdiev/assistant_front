// SPA "stale chunk" muammosi:
// Yangi `npm run build` har lazy-route chunk'iga yangi hash beradi va eskilarini
// o'chiradi. Foydalanuvchi brauzerida ESKI index.html ochiq turganda, tugma bosilib
// route o'zgarsa — u allaqachon o'chirilgan eski chunk'ni so'raydi → 404 →
// "Failed to fetch dynamically imported module" → navigatsiya jimgina ishlamaydi.
//
// Yechim: shu xatoni ushlab, bir marta (loop'siz) to'liq qayta yuklaymiz — shunda
// yangi index.html + yangi chunk'lar keladi va foydalanuvchi maqsad sahifasiga o'tadi.

const RELOAD_AT_KEY = 'spa:chunk-reload-at'
const COOLDOWN_MS = 10_000

/** Dinamik import (chunk) yuklash xatosimi? (brauzerlar matni har xil bo'ladi) */
export function isDynamicImportError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('unable to preload css')
  )
}

/**
 * Yangi deploy aniqlanganda bir marta to'liq qayta yuklash.
 * `target` berilsa — o'sha yo'lga o'tadi (foydalanuvchi bosgan sahifa).
 * Cooldown (10s) cheksiz reload loop'ining oldini oladi.
 */
export function reloadForNewDeploy(target?: string): void {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0)
  } catch { /* sessionStorage bloklangan bo'lishi mumkin */ }

  if (Date.now() - last < COOLDOWN_MS) return // yaqinda urindik — loop'ni to'xtatamiz

  try {
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()))
  } catch { /* e'tiborsiz */ }

  const current = window.location.pathname + window.location.search
  if (target && target !== current) {
    window.location.assign(target)
  } else {
    window.location.reload()
  }
}
