<template>
  <div class="app-shell">
    <AppHeader @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />

    <div class="app-body">
      <AppSidebar :collapsed="sidebarCollapsed" />

      <main class="app-main">
        <WebPushBanner v-if="auth.isAuthenticated" />
        <slot />
      </main>

      <RightPanel v-if="auth.isAuthenticated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import RightPanel from '@/components/layout/RightPanel.vue'
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #f5f7fa;
}
</style>
