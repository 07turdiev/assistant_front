import { defineStore } from 'pinia'
import { ref } from 'vue'
import { infoApi, type Choice } from '@/api/info'

export const useLookupStore = defineStore('lookup', () => {
  const spheres = ref<Choice[]>([])
  const types = ref<Choice[]>([])
  const taskReplies = ref<Choice[]>([])
  const requestReplies = ref<Choice[]>([])
  const roles = ref<Choice[]>([])
  const statuses = ref<Choice[]>([])
  const loaded = ref(false)

  async function loadAll(force = false) {
    if (loaded.value && !force) return
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
  }
})
