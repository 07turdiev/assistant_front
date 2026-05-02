<template>
  <el-container class="app-shell">
    <AppSidebar :collapsed="sidebarCollapsed" />
    <el-container>
      <AppHeader @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />
      <el-main class="app-main">
        <WebPushBanner v-if="auth.isAuthenticated" />
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import WebPushBanner from '@/components/notification/WebPushBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'
import { useLookupStore } from '@/stores/lookup'
import { useWebPushStore } from '@/stores/webpush'
import { useAppWebSocket } from '@/composables/useAppWebSocket'

const auth = useAuthStore()
const notifications = useNotificationsStore()
const chat = useChatStore()
const lookup = useLookupStore()
const webpush = useWebPushStore()

const sidebarCollapsed = ref(false)

useAppWebSocket()

async function bootstrap() {
  if (!auth.isAuthenticated) return
  await Promise.allSettled([
    notifications.fetchUnreadCount(),
    chat.fetchUnreadCount(),
    lookup.loadAll(),
    webpush.init(),
  ])
}

onMounted(bootstrap)

watch(
  () => auth.isAuthenticated,
  (val) => {
    if (val) bootstrap()
  }
)
</script>

<style lang="scss" scoped>
.app-shell {
  height: 100vh;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
}
</style>
