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
        style="width: 240px"
        @input="onSearch"
      />
      <el-select
        v-model="filters.role"
        :placeholder="$t('admin.filterRole')"
        clearable
        style="width: 200px"
        @change="reload"
      >
        <el-option v-for="r in lookup.roles" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-select
        v-model="filters.enabled"
        :placeholder="$t('admin.filterEnabled')"
        clearable
        style="width: 160px"
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
      <el-table-column :label="$t('admin.userTable.status')" width="140">
        <template #default="{ row }">
          <el-tag>{{ row.status }}</el-tag>
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
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Edit, Delete, Key } from '@element-plus/icons-vue'
import { adminUsersApi } from '@/api/admin'
import { useLookupStore } from '@/stores/lookup'
import type { User } from '@/types/user'

const { t } = useI18n()
const router = useRouter()

function onRowClick(row: User, _column: unknown, event: MouseEvent) {
  // Action tugmalari va switch'lar bosilganda row click ishlamasin
  const target = event.target as HTMLElement
  if (target.closest('button, .el-switch, .el-button')) return
  router.push({ name: 'admin.users.detail', params: { id: row.id } })
}

const lookup = useLookupStore()

const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)
const togglingId = ref<string | null>(null)

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
  } catch (_e) {
    ElMessage.error(t('common.error'))
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
    await adminUsersApi.update(row.id, { enabled: !row.enabled } as never)
    row.enabled = !row.enabled
  } catch (_e) {
    ElMessage.error(t('common.error'))
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
  } catch (_e) {
    ElMessage.error(t('common.error'))
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
  } catch (_e) {
    ElMessage.error(t('common.error'))
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
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
