<template>
  <header class="app-header">
    <!-- Chap: hamburger + vazirlik nomi -->
    <div class="app-header__left">
      <button class="hamburger" @click="$emit('toggle-sidebar')">
        <el-icon size="22"><Menu /></el-icon>
      </button>
      <div class="ministry">
        <span class="ministry__line">{{ $t('app.ministry1') }}</span>
        <span class="ministry__line">{{ $t('app.ministry2') }}</span>
      </div>
    </div>

    <!-- Markaz: foydalanuvchi nomi va lavozimi -->
    <div class="app-header__center">
      <span v-if="auth.user" class="user-fullname">{{ fullNameWithFather }}</span>
      <span v-if="positionLabel" class="user-position">— {{ positionLabel }}</span>
    </div>

    <!-- O'ng: bildirishnoma + til + profil -->
    <div class="app-header__right">
      <el-dropdown trigger="click" placement="bottom-end" :hide-on-click="false">
        <button class="icon-btn">
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

      <LangSwitch />

      <el-dropdown trigger="click" placement="bottom-end">
        <button class="profile-chip">
          <el-avatar :size="36" :src="auth.user?.avatar_url || undefined">
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
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, Menu, User, Edit, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { formatTime } from '@/utils/date'
import LangSwitch from '@/components/common/LangSwitch.vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const auth = useAuthStore()
const notifications = useNotificationsStore()
const router = useRouter()
const { locale } = useI18n()

const fullNameWithFather = computed(() => {
  if (!auth.user) return ''
  const u = auth.user
  return [u.last_name, u.first_name, u.father_name].filter(Boolean).join(' ')
})

const positionLabel = computed(() => {
  if (!auth.user) return ''
  return locale.value === 'ru' ? auth.user.position_ru || '' : auth.user.position_uz || ''
})

const initials = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name?.[0] ?? ''}${auth.user.first_name?.[0] ?? ''}`.toUpperCase()
})

function goProfile() {
  router.push({ name: 'profile' })
}

function goProfileEdit() {
  router.push({ name: 'profile.edit' })
}

function goWebPushSettings() {
  router.push({ name: 'notifications.settings' })
}

async function markAllRead() {
  const ids = notifications.items.filter((n) => !n.seen).map((n) => n.id)
  if (ids.length > 0) {
    await notifications.markRead(ids)
  }
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
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  z-index: 10;
  position: relative;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 280px;
  }

  &__center {
    flex: 1;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0 16px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 200px;
    justify-content: flex-end;
  }
}

.hamburger {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #5a6c7d;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f7fa;
    color: #1976d2;
  }
}

.ministry {
  display: flex;
  flex-direction: column;
  font-size: 11px;
  line-height: 1.3;
  color: #5a6c7d;
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.user-fullname {
  font-size: 15px;
  font-weight: 500;
  color: #1f2d3d;
}

.user-position {
  font-size: 13px;
  color: #909399;
  margin-left: 6px;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #5a6c7d;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #ecf5ff;
    color: #1976d2;
  }
}

.profile-chip {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  transition: box-shadow 0.15s;
  display: inline-flex;

  &:hover {
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
  }
}

.notify-dropdown {
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid #ebeef5;
    font-weight: 500;
    color: #1f2d3d;
  }
}

.notify-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.notify-empty {
  padding: 24px 16px;
  color: #909399;
  text-align: center;
  font-size: 13px;
}

.notify-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f5f7fa;
  }

  &--unread {
    background: #ecf5ff;
    border-left: 3px solid #409eff;
  }

  &__title {
    font-size: 13px;
    color: #1f2d3d;
    font-weight: 500;
  }

  &__time {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
  }
}
</style>
