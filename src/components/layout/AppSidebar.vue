<template>
  <el-aside :width="collapsed ? '64px' : '240px'" class="app-sidebar">
    <div class="app-sidebar__logo" :class="{ 'app-sidebar__logo--collapsed': collapsed }">
      <template v-if="!collapsed">
        <div class="logo-icon">SA</div>
        <div class="logo-text">{{ $t('app.title') }}</div>
      </template>
      <div v-else class="logo-icon">SA</div>
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
          {{ $t('admin.directionsLabel') }}
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
import { useAuthStore } from '@/stores/auth'
import {
  HomeFilled,
  Calendar,
  Document,
  Setting,
} from '@element-plus/icons-vue'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
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
    height: 64px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #409eff 0%, #1976d2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
    }

    &--collapsed {
      justify-content: center;
      padding: 0;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}
</style>
