import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Realtime "bump" store — WebSocket xabari kelganda ko'rinishlarni jonli yangilash uchun.
 *
 * useAppWebSocket `notify` kanali kelganda turiga qarab bump qiladi:
 *   - tadbir (NEW/EDITED/DELETED/REMINDED) → bumpEvents() → kalendar qayta yuklanadi
 *   - e'lon (ANNOUNCEMENT)                 → bumpAnnouncements() → e'lonlar taxtasi yangilanadi
 *
 * Komponentlar shu hisoblagichlarni `watch` qiladi va o'z ma'lumotini qayta yuklaydi.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const eventsBump = ref(0)
  const announcementsBump = ref(0)

  function bumpEvents() {
    eventsBump.value++
  }
  function bumpAnnouncements() {
    announcementsBump.value++
  }

  return { eventsBump, announcementsBump, bumpEvents, bumpAnnouncements }
})
