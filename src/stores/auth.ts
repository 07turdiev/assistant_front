import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { usersApi } from '@/api/users'
import type { UserMe, RoleName } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserMe | null>(null)
  const isLoading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const role = computed<RoleName | null>(() => user.value?.role.name ?? null)

  function hasRole(...names: RoleName[]): boolean {
    if (!role.value) return false
    return names.includes(role.value)
  }

  async function login(username: string, password: string) {
    isLoading.value = true
    try {
      await authApi.login({ username, password })
      await fetchMe()
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (_) {
      // ignore — har holatda lokal state'ni tozalaymiz
    }
    user.value = null
  }

  async function fetchMe() {
    const { data } = await usersApi.me()
    user.value = data
    return data
  }

  async function init() {
    if (initialized.value) return
    try {
      await fetchMe()
    } catch (_e) {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  function handleSessionExpired() {
    user.value = null
  }

  return {
    user,
    isLoading,
    initialized,
    isAuthenticated,
    role,
    hasRole,
    login,
    logout,
    fetchMe,
    init,
    handleSessionExpired,
  }
})
