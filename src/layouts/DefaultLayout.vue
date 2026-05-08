<template>
  <div class="app-shell" :class="{ 'is-mobile': isMobile }">
    <AppHeader
      :show-menu-button="auth.isAuthenticated && isMobile"
      :show-right-panel-button="auth.isAuthenticated && isMobile"
      :right-panel-badge="rightPanelBadgeCount"
      @toggle-sidebar="toggleSidebar"
      @toggle-right-panel="toggleRightPanel"
    />

    <div class="app-body">
      <!-- Sidebar — desktop'da inline, mobile'da slide-in drawer -->
      <AppSidebar
        :collapsed="!isMobile && sidebarCollapsed"
        :mobile-open="isMobile && sidebarOpen"
        :is-mobile="isMobile"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
        @navigate="closeMobileDrawers"
      />

      <!-- Mobile sidebar backdrop -->
      <div
        v-if="isMobile && sidebarOpen"
        class="mobile-backdrop"
        @click="sidebarOpen = false"
      />

      <!-- Sidebar va main orasida — chap chiziqda joylashgan toggle "tab" (faqat desktop) -->
      <button
        v-if="auth.isAuthenticated && !isMobile"
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

      <!-- Right panel — desktop'da inline, mobile'da slide-in drawer -->
      <RightPanel
        v-if="auth.isAuthenticated"
        :is-mobile="isMobile"
        :mobile-open="isMobile && rightPanelOpen"
        @close="rightPanelOpen = false"
        @open="onRightPanelOpenRequested"
        @badge-count="rightPanelBadgeCount = $event"
      />

      <!-- Mobile right-panel backdrop -->
      <div
        v-if="isMobile && rightPanelOpen"
        class="mobile-backdrop"
        @click="rightPanelOpen = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
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
const route = useRoute()

const MOBILE_BREAKPOINT = 768

const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const rightPanelOpen = ref(false)
const rightPanelBadgeCount = ref(0)
const isMobile = ref(
  typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT,
)

useAppWebSocket()

function updateViewport() {
  const w = window.innerWidth
  const wasMobile = isMobile.value
  isMobile.value = w < MOBILE_BREAKPOINT
  // Desktop'ga o'tilganda mobile drawerlarni yopamiz
  if (wasMobile && !isMobile.value) {
    sidebarOpen.value = false
    rightPanelOpen.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) sidebarOpen.value = !sidebarOpen.value
  else sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleRightPanel() {
  rightPanelOpen.value = !rightPanelOpen.value
}

function onRightPanelOpenRequested() {
  if (isMobile.value) rightPanelOpen.value = true
}

function closeMobileDrawers() {
  if (isMobile.value) {
    sidebarOpen.value = false
    rightPanelOpen.value = false
  }
}

// Yo'nalish o'zgarganda mobile drawerlarni yopamiz
watch(() => route.fullPath, closeMobileDrawers)

// Drawer ochiq turganda body scroll'ni bloklaymiz
watch([sidebarOpen, rightPanelOpen, isMobile], () => {
  const lock = isMobile.value && (sidebarOpen.value || rightPanelOpen.value)
  document.body.style.overflow = lock ? 'hidden' : ''
})

async function bootstrap() {
  if (!auth.isAuthenticated) return
  await Promise.allSettled([
    notifications.fetchUnreadCount(),
    chat.fetchUnreadCount(),
    lookup.loadAll(),
    webpush.init(),
  ])
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  bootstrap()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  document.body.style.overflow = ''
})

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
  height: 100dvh; // dynamic viewport — mobile browser address-bar uchun
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
  -webkit-overflow-scrolling: touch;
  padding: 16px 24px 24px;
  background: $color-bg-soft;
  min-width: 0; // flex child overflow oldini olish
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

/* Mobile drawer backdrop */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 90;
  animation: fade-in 0.2s ease;
  backdrop-filter: blur(2px);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================================
   Mobile (< 768px)
   ============================================================ */
@include mobile {
  .app-main {
    padding: 12px 12px 80px; // bottom padding for safe-area / floating buttons
  }
}
</style>
