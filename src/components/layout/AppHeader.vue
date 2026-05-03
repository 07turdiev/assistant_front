<template>
  <el-header class="app-header">
    <div class="app-header__left">
      <el-button text @click="$emit('toggle-sidebar')">
        <el-icon size="20"><Menu /></el-icon>
      </el-button>
    </div>

    <div class="app-header__right">
      <!-- Bildirishnomalar (chat/task/sorov RightPanel'da ko'rinadi) -->
      <el-dropdown trigger="click">
        <span class="header-icon">
          <el-badge :value="notifications.unreadCount" :hidden="notifications.unreadCount === 0" :max="99">
            <el-icon size="20"><Bell /></el-icon>
          </el-badge>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goNotifications">
              {{ $t('nav.notifications') }}
              <span v-if="notifications.unreadCount > 0">({{ notifications.unreadCount }})</span>
            </el-dropdown-item>
            <el-dropdown-item @click="goWebPushSettings">{{ $t('webpush.settings') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <LangSwitch />

      <el-dropdown trigger="click">
        <span class="user-chip">
          <el-avatar :size="32" :src="auth.user?.avatar_url || undefined">
            {{ initials }}
          </el-avatar>
          <span class="user-chip__name">{{ fullName }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile">{{ $t('nav.profile') }}</el-dropdown-item>
            <el-dropdown-item divided @click="onLogout">{{ $t('auth.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Menu } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import LangSwitch from '@/components/common/LangSwitch.vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const auth = useAuthStore()
const notifications = useNotificationsStore()
const router = useRouter()

const fullName = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name} ${auth.user.first_name}`.trim()
})

const initials = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name?.[0] ?? ''}${auth.user.first_name?.[0] ?? ''}`.toUpperCase()
})

function goProfile() {
  router.push({ name: 'profile' })
}

function goNotifications() {
  router.push({ name: 'notifications' })
}

function goWebPushSettings() {
  router.push({ name: 'notifications.settings' })
}

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 16px;

  &__right {
    display: flex;
    align-items: center;
    gap: 18px;
  }
}

.header-icon {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  color: #5a6c7d;
  transition: color 0.15s;

  &:hover {
    color: #409eff;
  }
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &__name {
    font-size: 14px;
    color: #1f2d3d;
  }
}
</style>
