<template>
  <div class="app-shell">
    <AppHeader />

    <div class="app-body">
      <AppSidebar
        :collapsed="sidebarCollapsed"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
      />

      <!-- Sidebar va main orasida — chap chiziqda joylashgan toggle "tab" -->
      <button
        v-if="auth.isAuthenticated"
        class="sidebar-edge-toggle"
        :class="{ 'is-collapsed': sidebarCollapsed }"
        type="button"
        :aria-label="sidebarCollapsed ? 'Menyuni ochish' : 'Menyuni yopish'"
        :title="sidebarCollapsed ? 'Menyuni ochish' : 'Menyuni yopish'"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <el-icon size="14">
          <ArrowLeft v-if="!sidebarCollapsed" />
          <ArrowRight v-else />
        </el-icon>
      </button>

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
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
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
@use '@/assets/styles/variables.scss' as *;

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
  background: $color-bg-soft;
}

/* Sidebar va main orasidagi floating toggle — chiroyli ovalsimon "tab" */
.sidebar-edge-toggle {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 44px;
  transform: translateY(-50%);
  border: 1px solid $color-border-soft;
  border-left: none;
  background: $color-bg;
  color: $color-text-muted;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 0 14px 14px 0;
  box-shadow: 2px 0 6px rgba(60, 64, 67, 0.06);
  transition:
    left 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.15s ease,
    color 0.15s ease,
    width 0.15s ease,
    box-shadow 0.15s ease;

  /* Sidebar ochiq holatda — sidebar chetiga yopishadi */
  left: $sidebar-width;

  &.is-collapsed {
    left: $sidebar-width-collapsed;
  }

  &:hover {
    background: $color-primary;
    color: #fff;
    width: 28px;
    box-shadow: 2px 0 12px rgba(26, 115, 232, 0.30);
    border-color: $color-primary;
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

</style>
