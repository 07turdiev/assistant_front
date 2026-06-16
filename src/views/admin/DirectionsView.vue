<template>
  <div class="directions-page" v-loading="loading">
    <!-- Yo'nalish qo'shish formasi (production layout) -->
    <el-card class="form-card">
      <template #header>
        <h2 class="section-title">{{ $t('directionsPage.addTitle') }}</h2>
      </template>

      <el-form :model="form" label-position="top">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="$t('directionsPage.name')" required>
              <el-input v-model="form.name_uz" :placeholder="$t('directionsPage.nameHint')" />
              <p v-if="showErrors && !form.name_uz" class="error-text">{{ $t('common.required') }}</p>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('directionsPage.parent')">
              <el-select v-model="form.parent_id" :placeholder="$t('directionsPage.parentHint')" filterable clearable style="width: 100%">
                <el-option
                  v-for="d in items"
                  :key="d.id"
                  :value="d.id"
                  :label="locale !== 'uz' ? d.name_ru : d.name_uz"
                  :disabled="editing?.id === d.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item :label="$t('directionsPage.kind')">
              <el-select v-model="form.kind" style="width: 100%">
                <el-option v-for="k in kindOptions" :key="k.value" :value="k.value" :label="k.label" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('directionsPage.head')">
              <el-select v-model="form.head_id" filterable clearable :placeholder="$t('directionsPage.headHint')" style="width: 100%">
                <el-option v-for="u in users" :key="u.id" :value="u.id" :label="userName(u)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('directionsPage.supervisor')">
              <el-select v-model="form.supervisor_id" filterable clearable :placeholder="$t('directionsPage.supervisorHint')" style="width: 100%">
                <el-option v-for="u in users" :key="u.id" :value="u.id" :label="userName(u)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-button type="primary" :loading="saving" @click="onSave">
          {{ editing ? $t('common.save') : $t('directionsPage.addBtn') }}
        </el-button>
        <el-button v-if="editing" @click="cancelEdit">{{ $t('common.cancel') }}</el-button>
      </el-form>
    </el-card>

    <!-- Mavjud yo'nalishlar (production layout) -->
    <el-card class="list-card">
      <template #header>
        <h2 class="section-title">{{ $t('directionsPage.listTitle') }}</h2>
      </template>

      <el-table :data="paginated" :stripe="false">
        <el-table-column type="index" label="№" width="80" :index="indexFrom" />
        <el-table-column :label="$t('directionsPage.name')" prop="name_uz">
          <template #default="{ row }">
            <a class="direction-link" @click.prevent="openEdit(row)">
              {{ locale !== 'uz' ? row.name_ru : row.name_uz }}
            </a>
          </template>
        </el-table-column>
        <el-table-column :label="$t('directionsPage.parent')">
          <template #default="{ row }">
            <span v-if="parentName(row.parent_id)">{{ parentName(row.parent_id) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('directionsPage.head')">
          <template #default="{ row }">
            <span v-if="row.head">{{ userName(row.head) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column width="80" align="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="onDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-select v-model="pageSize" style="width: 80px" @change="onPageSizeChange">
          <el-option :value="5" label="5" />
          <el-option :value="10" label="10" />
          <el-option :value="20" label="20" />
        </el-select>
        <span class="muted">{{ $t('directionsPage.itemsPerPage') }}</span>
        <span class="spacer"></span>
        <span class="muted">{{ $t('directionsPage.page') }}</span>
        <el-input-number
          v-model="page"
          :min="1"
          :max="totalPages"
          :step="1"
          size="small"
          controls-position="right"
          style="width: 90px"
        />
        <span class="muted">{{ $t('directionsPage.of') }} {{ totalPages }}</span>
        <el-button link :disabled="page <= 1" @click="page = page - 1">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button link :disabled="page >= totalPages" @click="page = page + 1">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Delete, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import {
  adminDirectionsApi,
  adminOrganisationsApi,
  type Direction,
  type DirectionHead,
  type DirectionPayload,
  type Organisation,
} from '@/api/admin'
import { usersApi } from '@/api/users'
import type { User } from '@/types/user'
import { showApiError } from '@/utils/api-error'

const { t, locale } = useI18n()

const items = ref<Direction[]>([])
const organisations = ref<Organisation[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const editing = ref<Direction | null>(null)
const showErrors = ref(false)

// Tashkiliy birlik turlari (backend DirectionKind bilan mos)
const kindOptions = computed(() => [
  { value: 'BOSHQARMA', label: t('directionKind.boshqarma') },
  { value: 'BOLIM', label: t('directionKind.bolim') },
  { value: 'XIZMAT', label: t('directionKind.xizmat') },
  { value: 'MUTAXASSIS', label: t('directionKind.mutaxassis') },
  { value: 'KOTIBIYAT', label: t('directionKind.kotibiyat') },
  { value: 'BOSHQA', label: t('directionKind.boshqa') },
])

function userName(u: User | DirectionHead): string {
  const parts = [u.last_name, u.first_name].filter(Boolean).join(' ').trim()
  return parts || u.username || '—'
}

const form = reactive<DirectionPayload>({
  name_uz: '',
  name_ru: '',
  organisation_id: '',
  parent_id: null,
  kind: 'BOLIM',
  head_id: null,
  supervisor_id: null,
})

const page = ref(1)
const pageSize = ref(5)

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)))
const paginated = computed(() =>
  items.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
)
const indexFrom = computed(() => (page.value - 1) * pageSize.value + 1)

function parentName(parentId: string | null): string {
  if (!parentId) return ''
  const p = items.value.find((d) => d.id === parentId)
  return p ? (locale.value !== 'uz' ? p.name_ru : p.name_uz) : ''
}

function resetForm() {
  form.name_uz = ''
  form.name_ru = ''
  form.organisation_id = organisations.value[0]?.id || ''
  form.parent_id = null
  form.kind = 'BOLIM'
  form.head_id = null
  form.supervisor_id = null
  showErrors.value = false
}

function cancelEdit() {
  editing.value = null
  resetForm()
}

function openEdit(row: Direction) {
  editing.value = row
  form.name_uz = row.name_uz
  form.name_ru = row.name_ru || row.name_uz
  form.organisation_id = row.organisation_id
  form.parent_id = row.parent_id
  form.kind = row.kind || 'BOLIM'
  form.head_id = row.head?.id || null
  form.supervisor_id = row.supervisor?.id || null
  showErrors.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadAll() {
  loading.value = true
  try {
    const [dirs, orgs, us] = await Promise.all([
      adminDirectionsApi.list({ page_size: 200 }),
      adminOrganisationsApi.list({ page_size: 200 }),
      usersApi.list({ page_size: 300 }),
    ])
    items.value = dirs.data.results || []
    organisations.value = orgs.data.results || []
    users.value = us.data.results || []
    if (organisations.value.length > 0 && !form.organisation_id) {
      form.organisation_id = organisations.value[0].id
    }
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

async function onSave() {
  showErrors.value = true
  if (!form.name_uz) return
  if (!form.organisation_id && organisations.value.length > 0) {
    form.organisation_id = organisations.value[0].id
  }
  saving.value = true
  try {
    const payload: DirectionPayload = {
      name_uz: form.name_uz,
      name_ru: form.name_ru || form.name_uz,
      organisation_id: form.organisation_id,
      parent_id: form.parent_id,
      kind: form.kind,
      head_id: form.head_id || null,
      supervisor_id: form.supervisor_id || null,
    }
    if (editing.value) {
      await adminDirectionsApi.update(editing.value.id, payload)
    } else {
      await adminDirectionsApi.create(payload)
    }
    ElMessage.success(t('common.success'))
    editing.value = null
    resetForm()
    await loadAll()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Direction) {
  await ElMessageBox.confirm(t('admin.directions.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await adminDirectionsApi.delete(row.id)
    ElMessage.success(t('common.success'))
    if (editing.value?.id === row.id) cancelEdit()
    await loadAll()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

function onPageSizeChange() {
  page.value = 1
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.directions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  margin: 4px 0 0;
}

.direction-link {
  color: #1f2d3d;
  cursor: pointer;
  text-decoration: none;
  &:hover {
    color: #409eff;
  }
}

.muted {
  color: #909399;
}

.pagination-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 13px;

  .spacer { flex: 1; }
}
</style>
