import { defineStore } from 'pinia'
import { ref } from 'vue'
import { infoApi, type Choice } from '@/api/info'

// Lookup'lar 5 daqiqada bir marta yangilanadi (kam o'zgaruvchan ma'lumotlar)
const CACHE_TTL_MS = 5 * 60 * 1000

export const useLookupStore = defineStore('lookup', () => {
  const spheres = ref<Choice[]>([])
  const types = ref<Choice[]>([])
  const taskReplies = ref<Choice[]>([])
  const requestReplies = ref<Choice[]>([])
  const roles = ref<Choice[]>([])
  const statuses = ref<Choice[]>([])
  const loaded = ref(false)
  const loadedAt = ref<number | null>(null)
  // Parallel chaqiriqlarni birlashtiramiz — bir vaqtning o'zida 6 emas, 1 ta API hit
  let inflight: Promise<void> | null = null

  function isFresh(): boolean {
    return (
      loaded.value
      && loadedAt.value !== null
      && Date.now() - loadedAt.value < CACHE_TTL_MS
    )
  }

  async function loadAll(force = false): Promise<void> {
    if (!force && isFresh()) return
    if (inflight) return inflight
    inflight = (async () => {
      try {
        const [s, t, tr, rr, r, st] = await Promise.all([
          infoApi.spheres(),
          infoApi.types(),
          infoApi.taskReplies(),
          infoApi.requestReplies(),
          infoApi.roles(),
          infoApi.statuses(),
        ])
        spheres.value = s.data
        types.value = t.data
        taskReplies.value = tr.data
        requestReplies.value = rr.data
        roles.value = r.data
        statuses.value = st.data
        loaded.value = true
        loadedAt.value = Date.now()
      } finally {
        inflight = null
      }
    })()
    return inflight
  }

  function invalidate() {
    loaded.value = false
    loadedAt.value = null
  }

  return {
    spheres,
    types,
    taskReplies,
    requestReplies,
    roles,
    statuses,
    loaded,
    loadAll,
    invalidate,
  }
})
