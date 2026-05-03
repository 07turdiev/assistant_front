<template>
  <el-aside :width="collapsed ? '64px' : '240px'" class="app-sidebar">
    <div class="app-sidebar__logo">
      <span v-if="!collapsed">{{ $t('app.title') }}</span>
      <span v-else>SA</span>
    </div>
    <el-menu
      :default-active="activeKey"
      :collapse="collapsed"
      router
      background-color="#1f2d3d"
      text-color="#cfd8e3"
      active-text-color="#ffffff"
    >
      <el-menu-item index="/dashboard" :route="{ name: 'dashboard' }">
        <el-icon><HomeFilled /></el-icon>
        <template #title>{{ $t('nav.dashboard') }}</template>
      </el-menu-item>

      <el-menu-item index="/calendar" :route="{ name: 'calendar' }">
        <el-icon><Calendar /></el-icon>
        <template #title>{{ $t('nav.calendar') }}</template>
      </el-menu-item>

      <el-menu-item index="/pre-events" :route="{ name: 'preEvents.list' }">
        <el-icon><Document /></el-icon>
        <template #title>{{ $t('nav.preEvents') }}</template>
      </el-menu-item>

      <el-menu-item index="/reports/tasks" :route="{ name: 'reports.tasks' }">
        <el-icon><List /></el-icon>
        <template #title>{{ $t('nav.tasks') }}</template>
      </el-menu-item>

      <el-menu-item index="/reports/requests" :route="{ name: 'reports.requests' }">
        <el-icon><Promotion /></el-icon>
        <template #title>{{ $t('nav.requests') }}</template>
      </el-menu-item>

      <el-menu-item index="/chat" :route="{ name: 'chat.list' }">
        <el-icon><ChatDotRound /></el-icon>
        <template #title>
          {{ $t('nav.chat') }}
          <el-badge v-if="chat.unreadCount > 0" :value="chat.unreadCount" class="ml-2" />
        </template>
      </el-menu-item>

      <el-menu-item index="/notifications" :route="{ name: 'notifications' }">
        <el-icon><Bell /></el-icon>
        <template #title>
          {{ $t('nav.notifications') }}
          <el-badge v-if="notifications.unreadCount > 0" :value="notifications.unreadCount" class="ml-2" />
        </template>
      </el-menu-item>

      <el-sub-menu v-if="canSeeAdmin" index="admin">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>{{ $t('nav.admin') }}</span>
        </template>
        <el-menu-item index="/admin" :route="{ name: 'admin.dashboard' }">
          {{ $t('admin.dashboard') }}
        </el-menu-item>
        <el-menu-item index="/admin/users" :route="{ name: 'admin.users' }">
          {{ $t('admin.users') }}
        </el-menu-item>
        <el-menu-item index="/admin/directions" :route="{ name: 'admin.directions' }">
          {{ $t('admin.directions') }}
        </el-menu-item>
        <el-menu-item index="/admin/organisations" :route="{ name: 'admin.organisations' }">
          {{ $t('admin.organisations') }}
        </el-menu-item>
        <el-menu-item index="/admin/regions" :route="{ name: 'admin.regions' }">
          {{ $t('admin.regions') }}
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import {
  HomeFilled,
  Calendar,
  Document,
  List,
  Promotion,
  ChatDotRound,
  Bell,
  Setting,
} from '@element-plus/icons-vue'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const chat = useChatStore()
const notifications = useNotificationsStore()
const auth = useAuthStore()

const activeKey = computed(() => route.path)
const canSeeAdmin = computed(() => auth.hasRole('SUPER_ADMIN', 'ADMIN'))
</script>

<style lang="scss" scoped>
.app-sidebar {
  background: #1f2d3d;
  color: #fff;
  transition: width 0.2s ease;

  &__logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.ml-2 {
  margin-left: 8px;
}
</style>
