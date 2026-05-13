<template>
  <header class="gc-header">
    <!-- Mobile hamburger -->
    <button
      v-if="showMenuButton"
      class="icon-btn icon-btn--menu"
      type="button"
      aria-label="Menu"
      @click="$emit('toggle-sidebar')"
    >
      <el-icon size="22"><Menu /></el-icon>
    </button>

    <!-- Chap: brand -->
    <div class="gc-header__brand">
      <router-link to="/" class="brand">
        <img src="/favicon.svg" alt="Smart assistant" class="brand__icon" />
        <span class="brand__name">Smart assistant</span>
      </router-link>
    </div>

    <!-- Markaz: sarlavha (joriy sahifa nomi yoki bo'sh) -->
    <div class="gc-header__center">
      <span v-if="auth.user" class="user-greeting">
        {{ fullNameWithFather }}<span v-if="positionLabel"> · {{ positionLabel }}</span>
      </span>
    </div>

    <!-- O'ng: bildirishnoma + til + apps + profil -->
    <div class="gc-header__actions">
      <el-dropdown trigger="click" placement="bottom-end" :hide-on-click="false">
        <button class="icon-btn" aria-label="Notifications">
          <el-badge
            :value="notifications.unreadCount"
            :hidden="notifications.unreadCount === 0"
            :max="99"
          >
            <el-icon size="22"><Bell /></el-icon>
          </el-badge>
        </button>
        <template #dropdown>
          <el-dropdown-menu class="notify-dropdown">
            <div class="notify-dropdown__header">
              <span>{{ $t('nav.notifications') }}</span>
              <el-button
                v-if="notifications.unreadCount > 0"
                type="primary"
                link
                size="small"
                @click="markAllRead"
              >
                {{ $t('header.markAllRead') }}
              </el-button>
            </div>
            <div class="notify-list">
              <div v-if="notifications.items.length === 0" class="notify-empty">
                {{ $t('notifications.empty') }}
              </div>
              <div
                v-for="n in notifications.items.slice(0, 8)"
                :key="n.id"
                class="notify-item"
                :class="{ 'notify-item--unread': !n.seen }"
              >
                <div class="notify-item__title">{{ n.title }}</div>
                <div class="notify-item__time">{{ formatTime(n.created_at) }}</div>
              </div>
            </div>
            <el-dropdown-item divided @click="goWebPushSettings">
              <el-icon><Setting /></el-icon>
              {{ $t('webpush.settings') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <a
        v-if="telegramBotUrl"
        :href="telegramBotUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="icon-btn icon-btn--telegram"
        :aria-label="$t('header.openTelegramBot')"
        :title="$t('header.openTelegramBot')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.563 8.265-1.86 8.766c-.14.62-.51.77-1.034.479l-2.852-2.103-1.376 1.325c-.152.152-.28.28-.574.28l.205-2.905 5.29-4.78c.23-.205-.05-.32-.357-.115l-6.54 4.119-2.82-.881c-.613-.193-.626-.613.128-.907l11.03-4.252c.51-.19.956.117.79.974z"/>
        </svg>
      </a>

      <LangSwitch class="lang-switch" />

      <button class="icon-btn icon-btn--settings" @click="goProfile" aria-label="Profile">
        <el-icon size="22"><Setting /></el-icon>
      </button>

      <el-dropdown trigger="click" placement="bottom-end">
        <button class="profile-chip" aria-label="Account">
          <el-avatar :size="32" :src="auth.user?.avatar_url || undefined">
            {{ initials }}
          </el-avatar>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile">
              <el-icon><User /></el-icon>
              {{ $t('nav.profile') }}
            </el-dropdown-item>
            <el-dropdown-item @click="goProfileEdit">
              <el-icon><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-dropdown-item>
            <el-dropdown-item divided @click="onLogout">
              <el-icon><SwitchButton /></el-icon>
              {{ $t('auth.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- Mobile right-panel toggle -->
      <button
        v-if="showRightPanelButton"
        class="icon-btn icon-btn--right-panel"
        type="button"
        aria-label="Open chat panel"
        @click="$emit('toggle-right-panel')"
      >
        <el-badge
          :value="rightPanelBadge"
          :hidden="rightPanelBadge === 0"
          :max="99"
        >
          <el-icon size="22"><ChatLineRound /></el-icon>
        </el-badge>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, ChatLineRound, Edit, Menu, Setting, SwitchButton, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { formatTime } from '@/utils/date'
import LangSwitch from '@/components/common/LangSwitch.vue'

withDefaults(
  defineProps<{
    showMenuButton?: boolean
    showRightPanelButton?: boolean
    rightPanelBadge?: number
  }>(),
  { showMenuButton: false, showRightPanelButton: false, rightPanelBadge: 0 },
)

defineEmits<{
  'toggle-sidebar': []
  'toggle-right-panel': []
}>()

const auth = useAuthStore()
const notifications = useNotificationsStore()
const router = useRouter()
const { locale } = useI18n()

// Telegram bot link — .env'dagi VITE_TG_BOT_USERNAME bo'lmasa header'da tugma ko'rinmaydi.
const telegramBotUrl = computed(() => {
  const raw = (import.meta.env.VITE_TG_BOT_USERNAME || '').trim()
  if (!raw) return ''
  const username = raw.replace(/^@/, '')
  return `https://t.me/${username}`
})

const fullNameWithFather = computed(() => {
  if (!auth.user) return ''
  const u = auth.user
  return [u.last_name, u.first_name, u.father_name].filter(Boolean).join(' ')
})

const positionLabel = computed(() => {
  if (!auth.user) return ''
  return locale.value !== 'uz' ? auth.user.position_ru || '' : auth.user.position_uz || ''
})

const initials = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name?.[0] ?? ''}${auth.user.first_name?.[0] ?? ''}`.toUpperCase()
})

function goProfile() { router.push({ name: 'profile' }) }
function goProfileEdit() { router.push({ name: 'profile.edit' }) }
function goWebPushSettings() { router.push({ name: 'notifications.settings' }) }

async function markAllRead() {
  const ids = notifications.items.filter((n) => !n.seen).map((n) => n.id)
  if (ids.length > 0) await notifications.markRead(ids)
}

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  if (auth.isAuthenticated) {
    await notifications.fetchList(1).catch(() => undefined)
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

/* ============================================================
   Google Calendar style header
   ============================================================ */
.gc-header {
  height: $header-height;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: $color-bg;
  border-bottom: 1px solid $color-border-soft;
  flex-shrink: 0;
  z-index: 10;
  position: relative;
  gap: 4px;

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 240px;
  }

  &__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    overflow: hidden;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: $radius-sm;
  text-decoration: none;
  color: $color-text;

  &:hover {
    background: $color-bg-hover;
    text-decoration: none;
  }

  &__icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
    display: block;
  }

  &__name {
    font-family: $font-family-product;
    font-size: 22px;
    font-weight: 400;
    color: #5f6368;
    letter-spacing: 0.05em;
  }
}

.user-greeting {
  font-size: 14px;
  color: $color-text-muted;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ============================================================
   Action buttons (Google Material — circular + ripple-like hover)
   ============================================================ */
.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: $color-text-muted;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.12s ease, color 0.12s ease;
  flex-shrink: 0;
  text-decoration: none;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &:active {
    background: $color-border-soft;
  }

  /* Telegram brand button — ko'k rangda, e'tiborni jalb qiladi */
  &--telegram {
    color: #229ED9;

    svg {
      display: block;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    &:hover {
      background: rgba(34, 158, 217, 0.10);
      color: #1c8bc0;

      svg { transform: scale(1.08); }
    }
  }
}

.profile-chip {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.15s ease;
  margin-left: 4px;
  flex-shrink: 0;

  &:hover {
    box-shadow: 0 0 0 4px $color-bg-hover;
  }
}

/* ============================================================
   Notification dropdown
   ============================================================ */
.notify-dropdown {
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  border-radius: $radius-md !important;
  overflow: hidden;
}

:deep(.notify-dropdown__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid $color-border-soft;
  font-weight: 500;
  color: $color-text;
  font-size: 14px;
}

.notify-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.notify-empty {
  padding: 32px 16px;
  color: $color-text-muted;
  text-align: center;
  font-size: 13px;
}

.notify-item {
  padding: 12px 16px;
  border-bottom: 1px solid $color-border-soft;
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:last-child { border-bottom: none; }

  &:hover {
    background: $color-bg-hover;
  }

  &--unread {
    background: $color-primary-soft;

    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $color-primary;
      margin-right: 8px;
      vertical-align: middle;
    }
  }

  &__title {
    font-size: 13px;
    color: $color-text;
    font-weight: 500;
    line-height: 1.4;
  }

  &__time {
    font-size: 12px;
    color: $color-text-muted;
    margin-top: 2px;
  }
}

/* ============================================================
   Tablet (< 1024px)
   ============================================================ */
@media (max-width: 1023px) {
  .gc-header__center { display: none; }
  .gc-header__brand { min-width: 0; }
}

/* ============================================================
   Mobile (< 768px)
   ============================================================ */
@include mobile {
  .gc-header {
    height: $header-height-mobile;
    padding: 0 8px;
  }

  .brand {
    padding: 2px 4px;
    gap: 6px;

    &__icon {
      width: 28px;
      height: 28px;
    }

    &__name {
      font-size: 16px;
      letter-spacing: 0.02em;
      // Juda kichik ekranlarda yashiramiz
      @media (max-width: #{$bp-xs}) {
        display: none;
      }
    }
  }

  .icon-btn {
    width: 38px;
    height: 38px;

    // Settings (gear) tugmasini mobile'da yashiramiz — profil dropdown'da bor
    &--settings {
      display: none;
    }
  }

  .profile-chip {
    margin-left: 0;
    width: 38px;
    height: 38px;
  }

  .lang-switch {
    // Til switcherini juda kichik ekranlarda yashiramiz
    @media (max-width: #{$bp-xs}) {
      display: none;
    }
  }

  .gc-header__actions {
    gap: 0;
  }
}
</style>
