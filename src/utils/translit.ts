/**
 * O'zbek lotin yozuvidan krill yozuviga transliteratsiya.
 * DB'da ism/lavozim/bo'lim nomlari lotinda saqlanadi — kirill (uz-Cyrl) rejimida
 * ko'rsatishda shu funksiya orqali o'giramiz.
 */
import i18n from '@/i18n'

const singleCharMap: Record<string, string> = {
  A: 'А', a: 'а',
  B: 'Б', b: 'б',
  V: 'В', v: 'в',
  G: 'Г', g: 'г',
  D: 'Д', d: 'д',
  E: 'Е', e: 'е', // E/e maxsus qoidasi pastda
  J: 'Ж', j: 'ж',
  Z: 'З', z: 'з',
  I: 'И', i: 'и',
  Y: 'Й', y: 'й',
  K: 'К', k: 'к',
  L: 'Л', l: 'л',
  M: 'М', m: 'м',
  N: 'Н', n: 'н',
  O: 'О', o: 'о',
  P: 'П', p: 'п',
  Q: 'Қ', q: 'қ',
  R: 'Р', r: 'р',
  S: 'С', s: 'с',
  T: 'Т', t: 'т',
  U: 'У', u: 'у',
  F: 'Ф', f: 'ф',
  X: 'Х', x: 'х',
  H: 'Ҳ', h: 'ҳ',
  W: 'В', w: 'в',
  C: 'К', c: 'к',
  // Undoshdan keyingi apostrof (O'/G' digraflaridan tashqari) — ayirish belgisi
  "'": 'ъ',
}

// Ko'p harfli kombinatsiyalar (kirish normalize qilingani uchun standart ' ishlatamiz)
const multiCharMap: Record<string, string> = {
  // 3 harfli — eng avval tekshiriladi
  "Yo'": 'Йў', "YO'": 'ЙЎ', "yo'": 'йў',
  // 2 harfli digraflar
  Sh: 'Ш', SH: 'Ш', sh: 'ш',
  Ch: 'Ч', CH: 'Ч', ch: 'ч',
  "O'": 'Ў', "o'": 'ў',
  "G'": 'Ғ', "g'": 'ғ',
  Yo: 'Ё', YO: 'Ё', yo: 'ё', yO: 'ё',
  Yu: 'Ю', YU: 'Ю', yu: 'ю', yU: 'ю',
  Ya: 'Я', YA: 'Я', ya: 'я', yA: 'я',
  Ye: 'Е', YE: 'Е', ye: 'е', yE: 'е',
  Ts: 'Ц', TS: 'Ц', ts: 'ц',
}

const multiCharKeys = Object.keys(multiCharMap).sort((a, b) => b.length - a.length)
const maxMultiLen = multiCharKeys.reduce((m, k) => Math.max(m, k.length), 0)

// Barcha apostrof turlarini standart ' ga keltirish
function normalizeApostrophes(text: string): string {
  return text.replace(/[‘’ʹʻʼʽˊˋ`´′]/g, "'")
}

export function latinToCyrl(text: string): string {
  if (!text) return text
  text = normalizeApostrophes(text)

  let result = ''
  let i = 0
  const len = text.length

  while (i < len) {
    let matched = false

    for (let size = Math.min(maxMultiLen, len - i); size >= 2; size--) {
      const chunk = text.substring(i, i + size)
      if (multiCharMap[chunk] !== undefined) {
        result += multiCharMap[chunk]
        i += size
        matched = true
        break
      }
    }

    if (!matched) {
      const ch = text[i]
      // E/e: so'z boshida yoki unlidan keyin → Э/э; undoshdan keyin → Е/е
      if (ch === 'e' || ch === 'E') {
        const prev = i > 0 ? text[i - 1] : ''
        const prevIsLetter = /[a-zA-Z]/.test(prev)
        const prevIsVowel = 'aeiouAEIOU'.includes(prev)
        const useEh = !prevIsLetter || prevIsVowel
        result += ch === 'E' ? (useEh ? 'Э' : 'Е') : (useEh ? 'э' : 'е')
      } else {
        result += singleCharMap[ch] !== undefined ? singleCharMap[ch] : ch
      }
      i++
    }
  }

  return result
}

/** Joriy til kirill (uz-Cyrl) bo'lsa transliteratsiya qiladi, aks holda matnni qaytaradi. */
export function localize(text?: string | null): string {
  if (!text) return text || ''
  return i18n.global.locale.value === 'uz-Cyrl' ? latinToCyrl(text) : text
}

/**
 * Ikki tilli (uz/ru) maydon uchun: ru — to'g'ridan-to'g'ri; uz-Cyrl — uz transliteratsiya;
 * uz — uz o'zicha.
 */
export function localizeBilingual(uz?: string | null, ru?: string | null): string {
  return i18n.global.locale.value === 'ru' ? (ru || '') : localize(uz)
}
