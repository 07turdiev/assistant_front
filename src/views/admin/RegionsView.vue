<template>
  <el-row :gutter="16">
    <el-col :span="10">
      <el-card v-loading="loadingRegions">
        <template #header>
          <div class="header">
            <span>{{ $t('admin.regions') }}</span>
            <el-button type="primary" size="small" @click="openCreateRegion">
              {{ $t('admin.create') }}
            </el-button>
          </div>
        </template>

        <el-table
          :data="regions"
          highlight-current-row
          @current-change="onSelectRegion"
        >
          <el-table-column prop="name_uz" :label="$t('admin.nameUz')" />
          <el-table-column prop="name_ru" :label="$t('admin.nameRu')" />
          <el-table-column :label="$t('common.actions')" width="160">
            <template #default="{ row }">
              <el-button size="small" @click.stop="openEditRegion(row)">
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" type="danger" @click.stop="onDeleteRegion(row)">
                {{ $t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>

    <el-col :span="14">
      <el-card v-loading="loadingDistricts">
        <template #header>
          <div class="header">
            <span>
              {{ $t('admin.districts') }}
              <span v-if="selectedRegion" class="muted">/ {{ selectedRegion.name_uz }}</span>
            </span>
            <el-button
              type="primary"
              size="small"
              :disabled="!selectedRegion"
              @click="openCreateDistrict"
            >
              {{ $t('admin.create') }}
            </el-button>
          </div>
        </template>

        <el-empty v-if="!selectedRegion" :description="$t('admin.selectRegion')" />
        <el-table v-else :data="districts" stripe>
          <el-table-column prop="name_uz" :label="$t('admin.nameUz')" />
          <el-table-column prop="name_ru" :label="$t('admin.nameRu')" />
          <el-table-column :label="$t('common.actions')" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="openEditDistrict(row)">
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" type="danger" @click="onDeleteDistrict(row)">
                {{ $t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>
  </el-row>

  <el-dialog v-model="regionDialog.visible" :title="regionDialog.editing ? $t('admin.edit') : $t('admin.create')" width="420px">
    <el-form :model="regionDialog.form" label-position="top">
      <el-form-item :label="$t('admin.nameUz')">
        <el-input v-model="regionDialog.form.name_uz" />
      </el-form-item>
      <el-form-item :label="$t('admin.nameRu')">
        <el-input v-model="regionDialog.form.name_ru" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="regionDialog.visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="regionDialog.saving" @click="onSaveRegion">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="districtDialog.visible" :title="districtDialog.editing ? $t('admin.edit') : $t('admin.create')" width="420px">
    <el-form :model="districtDialog.form" label-position="top">
      <el-form-item :label="$t('admin.nameUz')">
        <el-input v-model="districtDialog.form.name_uz" />
      </el-form-item>
      <el-form-item :label="$t('admin.nameRu')">
        <el-input v-model="districtDialog.form.name_ru" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="districtDialog.visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="districtDialog.saving" @click="onSaveDistrict">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { adminRegionsApi, type Region, type District } from '@/api/admin'

const { t } = useI18n()

const regions = ref<Region[]>([])
const districts = ref<District[]>([])
const selectedRegion = ref<Region | null>(null)
const loadingRegions = ref(false)
const loadingDistricts = ref(false)

const regionDialog = reactive({
  visible: false,
  saving: false,
  editing: null as Region | null,
  form: { name_uz: '', name_ru: '' },
})

const districtDialog = reactive({
  visible: false,
  saving: false,
  editing: null as District | null,
  form: { name_uz: '', name_ru: '' },
})

async function loadRegions() {
  loadingRegions.value = true
  try {
    const { data } = await adminRegionsApi.list()
    regions.value = data
  } finally {
    loadingRegions.value = false
  }
}

async function loadDistricts(regionId: number) {
  loadingDistricts.value = true
  try {
    const { data } = await adminRegionsApi.districts(regionId)
    districts.value = data
  } finally {
    loadingDistricts.value = false
  }
}

async function onSelectRegion(row: Region | null) {
  selectedRegion.value = row
  if (row) await loadDistricts(row.id)
  else districts.value = []
}

function openCreateRegion() {
  regionDialog.editing = null
  regionDialog.form = { name_uz: '', name_ru: '' }
  regionDialog.visible = true
}

function openEditRegion(row: Region) {
  regionDialog.editing = row
  regionDialog.form = { name_uz: row.name_uz, name_ru: row.name_ru }
  regionDialog.visible = true
}

async function onSaveRegion() {
  regionDialog.saving = true
  try {
    if (regionDialog.editing) {
      await adminRegionsApi.update(regionDialog.editing.id, regionDialog.form)
    } else {
      await adminRegionsApi.create(regionDialog.form)
    }
    ElMessage.success(t('common.success'))
    regionDialog.visible = false
    await loadRegions()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    regionDialog.saving = false
  }
}

async function onDeleteRegion(row: Region) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await adminRegionsApi.delete(row.id)
    ElMessage.success(t('common.success'))
    if (selectedRegion.value?.id === row.id) {
      selectedRegion.value = null
      districts.value = []
    }
    await loadRegions()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  }
}

function openCreateDistrict() {
  districtDialog.editing = null
  districtDialog.form = { name_uz: '', name_ru: '' }
  districtDialog.visible = true
}

function openEditDistrict(row: District) {
  districtDialog.editing = row
  districtDialog.form = { name_uz: row.name_uz, name_ru: row.name_ru }
  districtDialog.visible = true
}

async function onSaveDistrict() {
  if (!selectedRegion.value) return
  districtDialog.saving = true
  try {
    const payload = { ...districtDialog.form, region_id: selectedRegion.value.id }
    if (districtDialog.editing) {
      await adminRegionsApi.updateDistrict(districtDialog.editing.id, payload)
    } else {
      await adminRegionsApi.createDistrict(payload)
    }
    ElMessage.success(t('common.success'))
    districtDialog.visible = false
    await loadDistricts(selectedRegion.value.id)
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    districtDialog.saving = false
  }
}

async function onDeleteDistrict(row: District) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await adminRegionsApi.deleteDistrict(row.id)
    ElMessage.success(t('common.success'))
    if (selectedRegion.value) await loadDistricts(selectedRegion.value.id)
  } catch (_e) {
    ElMessage.error(t('common.error'))
  }
}

onMounted(loadRegions)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.muted {
  color: #909399;
  font-weight: normal;
}
</style>
