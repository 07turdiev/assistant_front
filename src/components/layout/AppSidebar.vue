<template>
  <aside class="gc-sidebar" :class="{ 'gc-sidebar--collapsed': collapsed }">
    <!-- Create button — accordion-style (pastga ochiladi, navigatsiyani suradi) -->
    <div v-if="canCreate" class="create-wrap">
      <button
        v-if="!collapsed"
        class="create-btn"
        :class="{ 'create-btn--open': createOpen }"
        type="button"
        @click="createOpen = !createOpen"
      >
        <span class="create-btn__icon">
          <el-icon><Plus /></el-icon>
        </span>
        <span class="create-btn__label">{{ $t('reports.create') }}</span>
        <el-icon class="create-btn__caret" :class="{ 'is-open': createOpen }">
          <ArrowDown />
        </el-icon>
      </button>
      <button
        v-else
        class="create-btn create-btn--collapsed"
        type="button"
        :title="$t('reports.create')"
        @click="onCollapsedCreateClick"
      >
        <el-icon size="22"><Plus /></el-icon>
      </button>

      <transition name="create-accordion">
        <div v-if="createOpen && !collapsed" class="create-menu">
          <button
            v-if="canCreateEvent"
            class="create-menu__item"
            type="button"
            @click="handleCreate('event')"
          >
            <span class="create-menu__icon create-menu__icon--event">
              <el-icon><Calendar /></el-icon>
            </span>
            <span class="create-menu__label">{{ $t('event.create') }}</span>
          </button>
          <button
            v-if="canCreateTask"
            class="create-menu__item"
            type="button"
            @click="handleCreate('task')"
          >
            <span class="create-menu__icon create-menu__icon--task">
              <el-icon><Document /></el-icon>
            </span>
            <span class="create-menu__label">{{ $t('reports.taskTitle') }}</span>
          </button>
          <button
            v-if="canCreateRequest"
            class="create-menu__item"
            type="button"
            @click="handleCreate('request')"
          >
            <span class="create-menu__icon create-menu__icon--request">
              <el-icon><ChatLineRound /></el-icon>
            </span>
            <span class="create-menu__label">{{ $t('reports.requestTitle') }}</span>
          </button>
        </div>
      </transition>
    </div>

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
import { showApiError } from '@/utils/api-error'

const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

function onCollapsedCreateClick() {
  // Sidebar yopiq bo'lsa avval ochamiz, keyin accordion ham ochiladi
  if (props.collapsed) {
    emit('toggle')
    // Sidebar ochilgandan keyin (animatsiya tugagach) accordion ochiladi
    setTimeout(() => { createOpen.value = true }, 220)
  } else {
    createOpen.value = !createOpen.value
  }
}

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

const createOpen = ref(false)
const createDialogOpen = ref(false)
const createDialogKind = ref<'task' | 'request'>('task')
const creating = ref(false)
const createForm = reactive({ description: '' })

const createDialogTitle = computed(() =>
  createDialogKind.value === 'request' ? t('reports.requestTitle') : t('reports.taskTitle'),
)

function handleCreate(kind: 'event' | 'task' | 'request') {
  createOpen.value = false
  if (kind === 'event') {
    router.push({ name: 'events.create' })
  } else if (kind === 'task') {
    createDialogKind.value = 'task'
    createForm.description = ''
    createDialogOpen.value = true
  } else if (kind === 'request') {
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
    showApiError(e, t('common.error'))
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
   Create button + accordion menu (Material 3 polish)
   ============================================================ */
.create-wrap {
  display: flex;
  flex-direction: column;
  margin: 12px 8px 16px;
  position: relative;
}

.create-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 20px 0 14px;
  border: 1px solid transparent;
  border-radius: $radius-lg;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
  box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.08),
    0 1px 3px 1px rgba(60, 64, 67, 0.05);
  cursor: pointer;
  font-family: $font-family-product;
  font-size: 14px;
  font-weight: 500;
  color: $color-text;
  letter-spacing: 0.01em;
  transition:
    box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.22s ease,
    border-color 0.22s ease,
    border-radius 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.06s ease;
  width: 100%;
  outline: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      120deg,
      transparent 0%,
      rgba(26, 115, 232, 0.04) 50%,
      transparent 100%,
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    background: linear-gradient(180deg, #ffffff 0%, #f5faff 100%);
    border-color: rgba(26, 115, 232, 0.14);
    box-shadow:
      0 1px 3px 0 rgba(60, 64, 67, 0.10),
      0 4px 8px 3px rgba(60, 64, 67, 0.07);

    &::before { opacity: 1; }
    .create-btn__icon { transform: scale(1.05); box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.10); }
  }

  &:focus-visible {
    border-color: $color-primary;
    box-shadow:
      0 0 0 3px rgba(26, 115, 232, 0.20),
      0 1px 3px 0 rgba(60, 64, 67, 0.10);
  }

  &:active { transform: translateY(0.5px); }

  /* Menu ochilganda — pastki burchaklarni "yopishtiramiz" */
  &--open {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    background: linear-gradient(180deg, #ffffff 0%, #f5faff 100%);
    border-color: rgba(26, 115, 232, 0.18);
    box-shadow:
      0 1px 2px 0 rgba(60, 64, 67, 0.08),
      0 0 0 1px rgba(26, 115, 232, 0.04);

    .create-btn__icon {
      background: $color-primary;
      color: #fff;
      transform: rotate(45deg) scale(1.05);
    }

    .create-btn__label { color: $color-primary; }
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $color-primary-soft;
    color: $color-primary;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition:
      background-color 0.22s ease,
      color 0.22s ease,
      transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.22s ease;

    .el-icon { font-size: 18px; }
  }

  &__label {
    flex: 1;
    text-align: left;
    transition: color 0.18s ease;
  }

  &__caret {
    color: $color-text-muted;
    font-size: 14px;
    transition:
      transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
      color 0.18s ease;

    &.is-open {
      transform: rotate(180deg);
      color: $color-primary;
    }
  }

  &--collapsed {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
    margin: 0 auto;

    .create-btn__icon { width: auto; height: auto; background: transparent; }
  }
}

/* ============================================================
   Accordion menu — yumshoq, ko'tarilgan ko'rinish
   ============================================================ */
.create-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  margin-top: -1px;
  background: #fff;
  border: 1px solid rgba(26, 115, 232, 0.12);
  border-top: none;
  border-radius: 0 0 14px 14px;
  box-shadow:
    0 4px 12px -2px rgba(60, 64, 67, 0.10),
    0 8px 24px -4px rgba(60, 64, 67, 0.06);
  overflow: hidden;
  position: relative;

  /* Tugma bilan menu chegarasini yumshatadigan gradient yelkacha */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(26, 115, 232, 0.18) 50%,
      transparent 100%,
    );
  }
}

.create-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 48px;
  padding: 0 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-secondary;
  cursor: pointer;
  text-align: left;
  width: 100%;
  letter-spacing: 0.01em;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    padding 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  overflow: hidden;

  /* Hover'da chap tomonda subtle accent bar */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.18s ease, background-color 0.18s ease;
  }

  &:hover {
    background: rgba(26, 115, 232, 0.04);
    color: $color-text;
    padding-left: 18px;
  }

  &:hover::after { opacity: 0.4; }

  &:focus-visible {
    background: rgba(26, 115, 232, 0.06);
    box-shadow: inset 0 0 0 2px rgba(26, 115, 232, 0.30);
  }

  &:active {
    background: rgba(26, 115, 232, 0.08);
  }
}

.create-menu__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease;

  .el-icon { font-size: 17px; }

  &--event {
    background: linear-gradient(135deg, rgba(26, 115, 232, 0.12) 0%, rgba(26, 115, 232, 0.06) 100%);
    color: #1a73e8;
  }
  &--task {
    background: linear-gradient(135deg, rgba(217, 48, 37, 0.12) 0%, rgba(217, 48, 37, 0.06) 100%);
    color: #d93025;
  }
  &--request {
    background: linear-gradient(135deg, rgba(30, 142, 62, 0.12) 0%, rgba(30, 142, 62, 0.06) 100%);
    color: #1e8e3e;
  }

  /* Hover'da ikon halo */
  .create-menu__item:hover & {
    transform: scale(1.06);
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.03);
  }
}

.create-menu__label {
  flex: 1;
}

/* ============================================================
   Accordion transition (Material expressive)
   ============================================================ */
.create-accordion-enter-active {
  transition:
    max-height 0.32s cubic-bezier(0.34, 1.06, 0.64, 1),
    opacity 0.20s ease 0.04s,
    transform 0.32s cubic-bezier(0.34, 1.06, 0.64, 1);
  overflow: hidden;
  max-height: 280px;
}

.create-accordion-leave-active {
  transition:
    max-height 0.24s cubic-bezier(0.4, 0, 0.4, 1),
    opacity 0.14s ease,
    transform 0.20s ease;
  overflow: hidden;
  max-height: 280px;
}

.create-accordion-enter-from,
.create-accordion-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.create-accordion-enter-to,
.create-accordion-leave-from {
  opacity: 1;
  transform: translateY(0);
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

