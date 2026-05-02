<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('admin.directions') }}</span>
        <el-button type="primary" @click="openCreate">{{ $t('admin.create') }}</el-button>
      </div>
    </template>

    <el-table :data="items" stripe>
      <el-table-column prop="name_uz" :label="$t('admin.nameUz')" />
      <el-table-column prop="name_ru" :label="$t('admin.nameRu')" />
      <el-table-column :label="$t('admin.parent')" width="220">
        <template #default="{ row }">
          {{ parentName(row.parent_id) || '—' }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? $t('admin.edit') : $t('admin.create')" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item :label="$t('admin.nameUz')">
          <el-input v-model="form.name_uz" />
        </el-form-item>
        <el-form-item :label="$t('admin.nameRu')">
          <el-input v-model="form.name_ru" />
        </el-form-item>
        <el-form-item :label="$t('admin.organisation')">
          <el-select v-model="form.organisation_id" filterable>
            <el-option
              v-for="o in organisations"
              :key="o.id"
              :value="o.id"
              :label="o.name_uz"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.parent')">
          <el-select v-model="form.parent_id" clearable>
            <el-option
              v-for="d in items"
              :key="d.id"
              :value="d.id"
              :label="d.name_uz"
              :disabled="editing?.id === d.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  adminDirectionsApi,
  adminOrganisationsApi,
  type Direction,
  type Organisation,
  type DirectionPayload,
} from '@/api/admin'

const { t } = useI18n()

const items = ref<Direction[]>([])
const organisations = ref<Organisation[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<Direction | null>(null)

const form = reactive<DirectionPayload>({
  name_uz: '',
  name_ru: '',
  organisation_id: '',
  parent_id: null,
})

function resetForm() {
  form.name_uz = ''
  form.name_ru = ''
  form.organisation_id = organisations.value[0]?.id || ''
  form.parent_id = null
}

function parentName(id: string | null) {
  if (!id) return ''
  return items.value.find((d) => d.id === id)?.name_uz || ''
}

async function loadAll() {
  loading.value = true
  try {
    const [dirs, orgs] = await Promise.all([adminDirectionsApi.list(), adminOrganisationsApi.list()])
    items.value = dirs.data
    organisations.value = orgs.data.results || []
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Direction) {
  editing.value = row
  form.name_uz = row.name_uz
  form.name_ru = row.name_ru
  form.organisation_id = row.organisation_id
  form.parent_id = row.parent_id
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    if (editing.value) {
      await adminDirectionsApi.update(editing.value.id, { ...form })
    } else {
      await adminDirectionsApi.create({ ...form })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    await loadAll()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Direction) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await adminDirectionsApi.delete(row.id)
    ElMessage.success(t('common.success'))
    await loadAll()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  }
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
