<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('admin.organisations') }}</span>
        <el-button type="primary" @click="openCreate">{{ $t('admin.create') }}</el-button>
      </div>
    </template>

    <el-table :data="items" stripe>
      <el-table-column prop="name_uz" :label="$t('admin.nameUz')" />
      <el-table-column prop="name_ru" :label="$t('admin.nameRu')" />
      <el-table-column prop="phone_number" :label="$t('profile.phone')" width="160" />
      <el-table-column :label="$t('admin.address')">
        <template #default="{ row }">{{ row.address_uz }}</template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button size="small" circle @click="openEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button size="small" type="danger" circle @click="onDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? $t('admin.edit') : $t('admin.create')" width="600px">
      <el-form :model="form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('admin.nameUz')">
              <el-input v-model="form.name_uz" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.nameRu')">
              <el-input v-model="form.name_ru" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('admin.addressUz')">
              <el-input v-model="form.address_uz" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.addressRu')">
              <el-input v-model="form.address_ru" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('profile.phone')">
              <el-input v-model="form.phone_number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.district')">
              <el-select v-model="form.district_id" filterable>
                <el-option
                  v-for="d in districts"
                  :key="d.id"
                  :value="d.id"
                  :label="d.name_uz"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Lat">
              <el-input-number v-model="form.lat" :precision="6" :step="0.001" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Lng">
              <el-input-number v-model="form.lng" :precision="6" :step="0.001" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('admin.parent')">
              <el-select v-model="form.parent_id" clearable>
                <el-option
                  v-for="o in items"
                  :key="o.id"
                  :value="o.id"
                  :label="o.name_uz"
                  :disabled="editing?.id === o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
import { Edit, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  adminOrganisationsApi,
  adminRegionsApi,
  type Organisation,
  type District,
  type OrganisationPayload,
} from '@/api/admin'
import { showApiError } from '@/utils/api-error'

const { t } = useI18n()

const items = ref<Organisation[]>([])
const districts = ref<District[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<Organisation | null>(null)

const form = reactive<OrganisationPayload>({
  name_uz: '',
  name_ru: '',
  address_uz: '',
  address_ru: '',
  phone_number: '',
  district_id: 0,
  parent_id: null,
  lat: null,
  lng: null,
})

function resetForm() {
  form.name_uz = ''
  form.name_ru = ''
  form.address_uz = ''
  form.address_ru = ''
  form.phone_number = ''
  form.district_id = districts.value[0]?.id || 0
  form.parent_id = null
  form.lat = null
  form.lng = null
}

async function loadAll() {
  loading.value = true
  try {
    const [orgs, dist] = await Promise.all([adminOrganisationsApi.list(), adminRegionsApi.districts()])
    items.value = orgs.data.results || []
    districts.value = dist.data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Organisation) {
  editing.value = row
  Object.assign(form, {
    name_uz: row.name_uz,
    name_ru: row.name_ru,
    address_uz: row.address_uz,
    address_ru: row.address_ru,
    phone_number: row.phone_number,
    district_id: row.district_id,
    parent_id: row.parent_id,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  })
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    if (editing.value) {
      await adminOrganisationsApi.update(editing.value.id, { ...form })
    } else {
      await adminOrganisationsApi.create({ ...form })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    await loadAll()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Organisation) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await adminOrganisationsApi.delete(row.id)
    ElMessage.success(t('common.success'))
    await loadAll()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
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
