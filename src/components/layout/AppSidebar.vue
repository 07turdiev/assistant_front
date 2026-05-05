<template>
  <aside class="gc-sidebar" :class="{ 'gc-sidebar--collapsed': collapsed }">
    <!-- Create button — dropdown with consistent options -->
    <el-dropdown
      v-if="canCreate"
      trigger="click"
      placement="bottom-start"
      popper-class="create-popper"
      @command="onCreateCommand"
    >
      <button v-if="!collapsed" class="create-btn" type="button">
        <span class="create-btn__icon">
          <el-icon><Plus /></el-icon>
        </span>
        <span class="create-btn__label">{{ $t('reports.create') }}</span>
        <el-icon class="create-btn__caret"><ArrowDown /></el-icon>
      </button>
      <button
        v-else
        class="create-btn create-btn--collapsed"
        type="button"
        :title="$t('reports.create')"
      >
        <el-icon size="22"><Plus /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="canCreateEvent" command="event">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('event.create') }}</span>
          </el-dropdown-item>
          <el-dropdown-item v-if="canCreateTask" command="task">
            <el-icon><Document /></el-icon>
            <span>{{ $t('reports.taskTitle') }}</span>
          </el-dropdown-item>
          <el-dropdown-item v-if="canCreateRequest" command="request">
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ $t('reports.requestTitle') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Navigatsiya -->
    <nav class="nav">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="nav-item"
        :class="{ 'nav-item--active': isActive(item.path) }"
        :title="collapsed ? $t(item.label) : ''"
      >
        <el-icon class="nav-item__icon"><component :is="item.icon" /></el-icon>
        <span v-if="!collapsed" class="nav-item__label">{{ $t(item.label) }}</span>
      </router-link>

      <!-- Admin sub-section -->
      <template v-if="canSeeAdmin">
        <div v-if="!collapsed" class="nav-divider">
          <span class="nav-divider__label">{{ $t('nav.admin') }}</span>
        </div>
        <div v-else class="nav-divider-line"></div>

        <router-link
          v-for="item in adminItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.path) }"
          :title="collapsed ? $t(item.label) : ''"
        >
          <el-icon class="nav-item__icon"><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed" class="nav-item__label">{{ $t(item.label) }}</span>
        </router-link>
      </template>
    </nav>

    <!-- Tezkor topshiriq/so'rov dialogi -->
    <el-dialog v-model="createDialogOpen" :title="createDialogTitle" width="520px">
      <el-form :model="createForm" label-position="top">
        <el-form-item :label="$t('reports.description')" required>
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('reports.descriptionHint')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogOpen = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="onCreateSubmit">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Calendar,
  ChatLineRound,
  Document,
  HomeFilled,
  OfficeBuilding,
  Plus,
  Setting,
  User,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { reportsApi } from '@/api/reports'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const navItems = [
  { name: 'dashboard', path: '/dashboard', label: 'nav.dashboard', icon: HomeFilled },
  { name: 'calendar', path: '/calendar', label: 'nav.calendar', icon: Calendar },
  { name: 'preEvents.list', path: '/pre-events', label: 'nav.preEvents', icon: Document },
  { name: 'drafts.list', path: '/drafts', label: 'nav.drafts', icon: Document },
]

const canSeeAdmin = computed(() => auth.hasRole('SUPER_ADMIN', 'ADMIN'))

const adminItems = [
  { name: 'admin.dashboard', path: '/admin', label: 'admin.dashboard', icon: Setting },
  { name: 'admin.users', path: '/admin/users', label: 'admin.users', icon: User },
  { name: 'admin.directions', path: '/admin/directions', label: 'admin.directions', icon: OfficeBuilding },
  { name: 'admin.organisations', path: '/admin/organisations', label: 'admin.organisations', icon: OfficeBuilding },
  { name: 'admin.regions', path: '/admin/regions', label: 'admin.regions', icon: OfficeBuilding },
]

function isActive(path: string): boolean {
  if (path === '/admin') return route.path === '/admin'
  return route.path === path || route.path.startsWith(path + '/')
}

// Yaratish ruxsatlari rol bo'yicha (backend permissions bilan moslashgan)
const canCreateEvent = computed(() =>
  auth.hasRole('PREMIER_MINISTER', 'VICE_MINISTER', 'ASSISTANT_PREMIER', 'HEAD', 'ASSISTANT', 'SUPER_ADMIN'),
)
const canCreateTask = computed(() => auth.hasRole('PREMIER_MINISTER', 'HEAD'))
const canCreateRequest = computed(() => auth.hasRole('ASSISTANT', 'ASSISTANT_PREMIER'))

const canCreate = computed(() =>
  canCreateEvent.value || canCreateTask.value || canCreateRequest.value,
)

const createDialogOpen = ref(false)
const createDialogKind = ref<'task' | 'request'>('task')
const creating = ref(false)
const createForm = reactive({ description: '' })

const createDialogTitle = computed(() =>
  createDialogKind.value === 'request' ? t('reports.requestTitle') : t('reports.taskTitle'),
)

function onCreateCommand(cmd: string) {
  if (cmd === 'event') {
    router.push({ name: 'events.create' })
  } else if (cmd === 'task') {
    createDialogKind.value = 'task'
    createForm.description = ''
    createDialogOpen.value = true
  } else if (cmd === 'request') {
    createDialogKind.value = 'request'
    createForm.description = ''
    createDialogOpen.value = true
  }
}

async function onCreateSubmit() {
  if (!createForm.description.trim()) return
  creating.value = true
  try {
    await reportsApi.create({ description: createForm.description.trim() })
    ElMessage.success(t('common.success'))
    createForm.description = ''
    createDialogOpen.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    creating.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

/* ============================================================
   Google Calendar light sidebar
   ============================================================ */
.gc-sidebar {
  width: $sidebar-width;
  flex-shrink: 0;
  background: $color-bg;
  border-right: 1px solid $color-border-soft;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  overflow-x: hidden;

  &--collapsed {
    width: $sidebar-width-collapsed;
    padding: 8px 4px;
    align-items: center;
  }
}

/* ============================================================
   Create button (Google Calendar's prominent FAB-like button)
   ============================================================ */
.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 24px 0 16px;
  margin: 8px 0 16px;
  border: none;
  border-radius: $radius-lg;
  background: $color-bg;
  box-shadow: $shadow-1;
  cursor: pointer;
  font-family: $font-family-product;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-secondary;
  transition: box-shadow 0.15s ease, background-color 0.15s ease;
  align-self: flex-start;
  width: calc(100% - 16px);
  margin-left: 8px;
  margin-right: 8px;

  &:hover {
    background: #f6fafe;
    box-shadow: $shadow-2;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-primary-soft;
    color: $color-primary;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;

    .el-icon { font-size: 18px; }
  }

  &__label {
    flex: 1;
    text-align: left;
  }

  &__caret {
    color: $color-text-muted;
    font-size: 14px;
  }

  &--collapsed {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
    margin: 8px auto 16px;

    .create-btn__icon { width: auto; height: auto; background: transparent; }
  }
}

/* ============================================================
   Navigation
   ============================================================ */
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 16px 0 12px;
  border-radius: 0 $radius-pill $radius-pill 0;
  margin-right: 8px;
  color: $color-text-secondary;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  letter-spacing: 0.01em;

  &:hover {
    background: $color-bg-hover;
    text-decoration: none;
    color: $color-text;
  }

  &__icon {
    font-size: 18px;
    width: 20px;
    flex-shrink: 0;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--active {
    background: $color-primary-soft;
    color: $color-primary;
    font-weight: 500;

    &:hover {
      background: #d2e3fc;
      color: $color-primary;
    }
  }
}

.gc-sidebar--collapsed .nav-item {
  width: 48px;
  height: 48px;
  padding: 0;
  margin: 0 auto;
  border-radius: 50%;
  justify-content: center;
}

/* ============================================================
   Section divider
   ============================================================ */
.nav-divider {
  margin: 16px 16px 4px;
  font-size: 11px;
  font-weight: 500;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-top: 12px;
  border-top: 1px solid $color-border-soft;

  &__label {
    line-height: 28px;
  }
}

.nav-divider-line {
  width: 32px;
  height: 1px;
  background: $color-border-soft;
  margin: 12px auto;
}
</style>
