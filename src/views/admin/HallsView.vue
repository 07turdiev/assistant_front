<template>
  <el-card v-loading="loading" class="halls-card">
    <template #header>
      <div class="header">
        <span>{{ $t('admin.halls') }}</span>
        <el-button type="primary" size="small" @click="openCreate">
          {{ $t('admin.create') }}
        </el-button>
      </div>
    </template>

    <el-empty v-if="halls.length === 0 && !loading" :description="$t('admin.noHalls')" />

    <el-table v-else :data="halls" stripe>
      <el-table-column :label="$t('halls.floor')" width="160">
        <template #default="{ row }">
          <el-tag size="small" type="info" effect="plain">{{ floorLabel(row.floor) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('halls.name')" />
      <el-table-column :label="$t('common.actions')" width="120" align="center">
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
  </el-card>

  <el-dialog
    v-model="dialog.visible"
    :title="dialog.editing ? $t('admin.edit') : $t('admin.create')"
    width="440px"
  >
    <el-form :model="dialog.form" label-position="top">
      <el-form-item :label="$t('halls.floor')" required>
        <el-select v-model="dialog.form.floor" :placeholder="$t('halls.selectFloor')" style="width: 100%">
          <el-option
            v-for="f in floorOptions"
            :key="f"
            :label="floorLabel(f)"
            :value="f"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('halls.name')" required>
        <el-input v-model="dialog.form.name" :placeholder="$t('halls.namePlaceholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog.visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="dialog.saving" @click="onSave">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { adminHallsApi, type Hall } from '@/api/admin'
import { showApiError } from '@/utils/api-error'

const { t } = useI18n()

// Tanlanadigan etajlar (vazirlik binosi: yerto'la -1, 1..5)
const floorOptions = [-2, -1, 1, 2, 3, 4, 5]

const halls = ref<Hall[]>([])
const loading = ref(false)

const dialog = reactive({
  visible: false,
  saving: false,
  editing: null as Hall | null,
  form: { floor: 1 as number, name: '' },
})

function floorLabel(floor: number): string {
  return t('halls.floorLabel', { n: floor })
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminHallsApi.list()
    halls.value = data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.editing = null
  dialog.form = { floor: 1, name: '' }
  dialog.visible = true
}

function openEdit(row: Hall) {
  dialog.editing = row
  dialog.form = { floor: row.floor, name: row.name }
  dialog.visible = true
}

async function onSave() {
  if (!dialog.form.name.trim()) {
    ElMessage.warning(t('halls.nameRequired'))
    return
  }
  dialog.saving = true
  try {
    const payload = { floor: dialog.form.floor, name: dialog.form.name.trim() }
    if (dialog.editing) {
      await adminHallsApi.update(dialog.editing.id, payload)
    } else {
      await adminHallsApi.create(payload)
    }
    ElMessage.success(t('common.success'))
    dialog.visible = false
    await load()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    dialog.saving = false
  }
}

async function onDelete(row: Hall) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
    .catch(() => 'cancel')
    .then(async (res) => {
      if (res === 'cancel') return
      try {
        await adminHallsApi.delete(row.id)
        ElMessage.success(t('common.success'))
        await load()
      } catch (e: unknown) {
        showApiError(e, t('common.error'))
      }
    })
}

onMounted(load)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.halls-card {
  max-width: 760px;
}
</style>
