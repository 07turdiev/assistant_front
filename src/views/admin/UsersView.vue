<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>{{ $t('admin.users') }}</span>
        <el-button type="primary" @click="$router.push({ name: 'admin.users.create' })">
          {{ $t('admin.createUser') }}
        </el-button>
      </div>
    </template>

    <div class="filters">
      <el-input
        v-model="filters.search"
        :placeholder="$t('common.search')"
        clearable
        class="filter-input filter-input--search"
        @input="onSearch"
      />
      <el-select
        v-model="filters.role"
        :placeholder="$t('admin.filterRole')"
        clearable
        class="filter-input filter-input--role"
        @change="reload"
      >
        <el-option v-for="r in lookup.roles" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-select
        v-model="filters.enabled"
        :placeholder="$t('admin.filterEnabled')"
        clearable
        class="filter-input filter-input--enabled"
        @change="reload"
      >
        <el-option :label="$t('common.yes')" :value="true" />
        <el-option :label="$t('common.no')" :value="false" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="users" stripe @row-click="onRowClick">
      <el-table-column prop="username" :label="$t('admin.userTable.username')" width="160" />
      <el-table-column :label="$t('admin.userTable.fullName')">
        <template #default="{ row }">
          <span class="user-link">{{ row.last_name }} {{ row.first_name }} {{ row.father_name || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.userTable.role')" width="160">
        <template #default="{ row }">
          {{ row.role?.label_uz || row.role?.name }}
        </template>
      </el-table-column>
      <el-table-column prop="phone_number" :label="$t('profile.phone')" width="160" />
      <el-table-column :label="$t('admin.userTable.status')" width="180">
        <template #default="{ row }">
          <el-dropdown
            trigger="click"
            placement="bottom-start"
            :disabled="row.id === statusUpdatingId"
            popper-class="status-popper"
            @command="(s: UserStatus) => onChangeStatus(row, s)"
          >
            <button
              type="button"
              class="status-pill"
              :class="`status-pill--${statusVariant(row.status)}`"
              :disabled="row.id === statusUpdatingId"
              @click.stop
            >
              <span class="status-pill__dot"></span>
              <span class="status-pill__label">{{ statusLabel(row.status) }}</span>
              <el-icon v-if="row.id === statusUpdatingId" class="status-pill__spinner is-spin">
                <Loading />
              </el-icon>
              <el-icon v-else class="status-pill__caret"><CaretBottom /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu class="status-menu">
                <el-dropdown-item
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :command="opt.value"
                  :disabled="opt.value === row.status"
                  class="status-menu__item"
                  :class="[
                    `status-menu__item--${statusVariant(opt.value)}`,
                    { 'is-active': opt.value === row.status },
                  ]"
                >
                  <span class="status-menu__dot"></span>
                  <span class="status-menu__label">{{ opt.label }}</span>
                  <el-icon v-if="opt.value === row.status" class="status-menu__check">
                    <Check />
                  </el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.userTable.enabled')" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :loading="row.id === togglingId"
            @change="onToggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              size="small"
              circle
              @click.stop="$router.push({ name: 'admin.users.edit', params: { id: row.id } })"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('admin.resetPassword')" placement="top">
            <el-button size="small" type="warning" circle @click.stop="onResetPassword(row)">
              <el-icon><Key /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button size="small" type="danger" circle @click.stop="onDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      :current-page="filters.page"
      :page-size="filters.page_size"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="onPageChange"
    />
  </el-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { CaretBottom, Check, Edit, Delete, Key, Loading } from '@element-plus/icons-vue'
import { adminUsersApi } from '@/api/admin'
import { useLookupStore } from '@/stores/lookup'
import type { User } from '@/types/user'
import { extractApiError, showApiError } from '@/utils/api-error'

type UserStatus = 'AT_WORK' | 'ON_HOLIDAY' | 'WORK_TRIP' | 'DISMISSED' | 'IN_CHILDHOOD_RAISING'

const { t } = useI18n()
const router = useRouter()

function onRowClick(row: User, _column: unknown, event: MouseEvent) {
  // Action tugmalari, switchlar va status dropdown bosilganda row click ishlamasin
  const target = event.target as HTMLElement
  if (target.closest('button, .el-switch, .el-button, .el-tag, .el-dropdown, .el-dropdown-menu')) return
  router.push({ name: 'admin.users.detail', params: { id: row.id } })
}

const lookup = useLookupStore()

const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)
const togglingId = ref<string | null>(null)
const statusUpdatingId = ref<string | null>(null)

type TagType = 'success' | 'warning' | 'info' | 'danger' | 'primary'

const statusOptions = computed<{ value: UserStatus; label: string }[]>(() => [
  { value: 'AT_WORK', label: t('userStatus.atWork') },
  { value: 'ON_HOLIDAY', label: t('userStatus.onHoliday') },
  { value: 'WORK_TRIP', label: t('userStatus.workTrip') },
  { value: 'IN_CHILDHOOD_RAISING', label: t('userStatus.childcare') },
  { value: 'DISMISSED', label: t('userStatus.dismissed') },
])

function statusLabel(status: string): string {
  return statusOptions.value.find((s) => s.value === status)?.label || status
}

function statusTagType(status: string): TagType {
  switch (status) {
    case 'AT_WORK': return 'success'
    case 'DISMISSED': return 'info'
    case 'ON_HOLIDAY': return 'warning'
    case 'WORK_TRIP': return 'primary'
    case 'IN_CHILDHOOD_RAISING': return 'warning'
    default: return 'info'
  }
}

function statusVariant(status: string): string {
  switch (status) {
    case 'AT_WORK': return 'work'
    case 'ON_HOLIDAY': return 'holiday'
    case 'WORK_TRIP': return 'trip'
    case 'IN_CHILDHOOD_RAISING': return 'childcare'
    case 'DISMISSED': return 'dismissed'
    default: return 'unknown'
  }
}

async function onChangeStatus(row: User, newStatus: UserStatus) {
  if (newStatus === row.status) return
  statusUpdatingId.value = row.id
  try {
    await adminUsersApi.changeStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(t('common.success'))
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    statusUpdatingId.value = null
  }
}

const filters = reactive({
  page: 1,
  page_size: 20,
  search: '',
  role: undefined as string | undefined,
  enabled: undefined as boolean | undefined,
})

let searchTimer: number | null = null

async function reload() {
  loading.value = true
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      search: filters.search || undefined,
      role: filters.role || undefined,
      enabled: filters.enabled,
    }
    const { data } = await adminUsersApi.list(params as never)
    users.value = data.results
    total.value = data.count
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.page = 1
    reload()
  }, 350)
}

function onPageChange(page: number) {
  filters.page = page
  reload()
}

async function onToggleEnabled(row: User) {
  togglingId.value = row.id
  try {
    await adminUsersApi.patch(row.id, { enabled: !row.enabled })
    row.enabled = !row.enabled
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    togglingId.value = null
  }
}

async function onResetPassword(row: User) {
  await ElMessageBox.confirm(t('admin.confirmResetPassword'), t('common.confirm'), {
    type: 'warning',
  })
  try {
    const { data } = await adminUsersApi.resetPassword(row.id)
    if (data.generated_password) {
      ElMessageBox.alert(data.generated_password, t('admin.newPassword'), { type: 'success' })
    } else {
      ElMessage.success(t('common.success'))
    }
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

async function onDelete(row: User) {
  await ElMessageBox.confirm(t('admin.confirmDeleteUser'), t('common.confirm'), {
    type: 'warning',
  })
  try {
    await adminUsersApi.delete(row.id)
    ElMessage.success(t('common.success'))
    await reload()
  } catch (e: unknown) {
    const msg = extractApiError(e, t('common.error'))
    ElMessageBox.alert(msg.replace(/\n/g, '<br>'), t('common.error'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      dangerouslyUseHTMLString: msg.includes('\n'),
    })
  }
}

onMounted(async () => {
  await lookup.loadAll()
  await reload()
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-input {
  flex: 1 1 auto;
  min-width: 0;
}
.filter-input--search { max-width: 240px; }
.filter-input--role { max-width: 200px; }
.filter-input--enabled { max-width: 160px; }
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  :deep(.el-card__header) {
    padding: 12px 14px;
  }
  :deep(.el-card__body) {
    padding: 12px;
  }
  .filter-input--search,
  .filter-input--role,
  .filter-input--enabled {
    max-width: none;
    flex: 1 1 100%;
  }
  .pagination {
    justify-content: center;
  }
}

/* ============================================================
   Status pill (jadval ichida)
   ============================================================ */
.status-pill {
  --status-bg: #f0f9ff;
  --status-fg: #1976d2;
  --status-border: rgba(64, 158, 255, 0.18);
  --status-dot: #409eff;

  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 10px;
  border-radius: 999px;
  background: var(--status-bg);
  color: var(--status-fg);
  border: 1px solid var(--status-border);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
  font-family: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.06s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: var(--status-dot);
    transform: translateY(-0.5px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-dot);
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
  }

  &__label {
    flex: 1;
  }

  &__caret {
    font-size: 11px;
    opacity: 0.55;
    margin-left: 2px;
    transition: transform 0.15s ease;
  }

  &__spinner {
    font-size: 13px;
    margin-left: 2px;
  }

  &.is-spin {
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Pulse animation faqat AT_WORK uchun */
.status-pill--work .status-pill__dot {
  animation: status-pulse 2.5s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.6); }
  50% { box-shadow: 0 0 0 4px rgba(103, 194, 58, 0), 0 0 0 2px rgba(255, 255, 255, 0.6); }
}

/* Variantlar — fon, matn, dot */
.status-pill--work {
  --status-bg: #ecfdf3;
  --status-fg: #027a48;
  --status-border: rgba(103, 194, 58, 0.22);
  --status-dot: #67c23a;
}

.status-pill--holiday {
  --status-bg: #fff7ed;
  --status-fg: #b45309;
  --status-border: rgba(230, 162, 60, 0.22);
  --status-dot: #f59e0b;
}

.status-pill--trip {
  --status-bg: #eff6ff;
  --status-fg: #1e40af;
  --status-border: rgba(64, 158, 255, 0.22);
  --status-dot: #3b82f6;
}

.status-pill--childcare {
  --status-bg: #fdf4ff;
  --status-fg: #86198f;
  --status-border: rgba(217, 70, 239, 0.22);
  --status-dot: #d946ef;
}

.status-pill--dismissed {
  --status-bg: #f5f5f5;
  --status-fg: #6b7280;
  --status-border: rgba(144, 147, 153, 0.32);
  --status-dot: #9ca3af;
}

.status-pill--unknown {
  --status-bg: #f5f5f5;
  --status-fg: #909399;
  --status-border: #e4e7ed;
  --status-dot: #c0c4cc;
}
</style>

<!-- Status dropdown menyusi (body'ga teleport qilinadi — global) -->
<style lang="scss">
.status-popper.el-popper {
  --el-popper-border-radius: 12px;

  padding: 6px !important;
  border: 1px solid #ebeef5 !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04) !important;
  min-width: 200px;

  .el-popper__arrow { display: none !important; }
}

.status-menu.el-dropdown-menu {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-menu__item.el-dropdown-menu__item {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  font-size: 13px;
  color: #1f2d3d;
  line-height: 1.3;
  user-select: none;
  margin: 0 !important;
  height: auto;

  --status-dot: #409eff;

  &:not(.is-disabled):hover,
  &:not(.is-disabled):focus {
    background: #f5f7fa !important;
    color: #1f2d3d !important;
    outline: none;
  }

  &.is-active,
  &.is-disabled {
    background: rgba(64, 158, 255, 0.06) !important;
    color: #1976d2 !important;
    cursor: default !important;
    font-weight: 600;
    opacity: 1 !important;
  }

  &--work { --status-dot: #67c23a; }
  &--holiday { --status-dot: #f59e0b; }
  &--trip { --status-dot: #3b82f6; }
  &--childcare { --status-dot: #d946ef; }
  &--dismissed { --status-dot: #9ca3af; }

  .status-menu__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-dot);
    flex-shrink: 0;
  }

  .status-menu__label {
    flex: 1;
  }

  .status-menu__check {
    font-size: 14px;
    color: #67c23a;
    flex-shrink: 0;
  }
}
</style>
