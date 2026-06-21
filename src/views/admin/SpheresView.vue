<template>
  <el-card v-loading="loading" class="spheres-card">
    <template #header>
      <div class="header">
        <span>{{ $t('admin.spheres') }}</span>
        <el-button type="primary" size="small" @click="openCreate">
          {{ $t('admin.create') }}
        </el-button>
      </div>
    </template>

    <el-empty v-if="spheres.length === 0 && !loading" :description="$t('admin.noSpheres')" />

    <el-table v-else :data="spheres" stripe>
      <el-table-column type="index" label="№" width="70" />
      <el-table-column prop="name" :label="$t('spheres.name')" />
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
      <el-form-item :label="$t('spheres.name')" required>
        <el-input v-model="dialog.form.name" :placeholder="$t('spheres.namePlaceholder')" />
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
import { adminSpheresApi, type Sphere } from '@/api/admin'
import { showApiError } from '@/utils/api-error'

const { t } = useI18n()

const spheres = ref<Sphere[]>([])
const loading = ref(false)

const dialog = reactive({
  visible: false,
  saving: false,
  editing: null as Sphere | null,
  form: { name: '' },
})

async function load() {
  loading.value = true
  try {
    const { data } = await adminSpheresApi.list()
    spheres.value = data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.editing = null
  dialog.form = { name: '' }
  dialog.visible = true
}

function openEdit(row: Sphere) {
  dialog.editing = row
  dialog.form = { name: row.name }
  dialog.visible = true
}

async function onSave() {
  if (!dialog.form.name.trim()) {
    ElMessage.warning(t('spheres.nameRequired'))
    return
  }
  dialog.saving = true
  try {
    const payload = { name: dialog.form.name.trim() }
    if (dialog.editing) {
      await adminSpheresApi.update(dialog.editing.id, payload)
    } else {
      await adminSpheresApi.create(payload)
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

async function onDelete(row: Sphere) {
  await ElMessageBox.confirm(t('admin.confirmDelete'), t('common.confirm'), { type: 'warning' })
    .catch(() => 'cancel')
    .then(async (res) => {
      if (res === 'cancel') return
      try {
        await adminSpheresApi.delete(row.id)
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
.spheres-card {
  max-width: 760px;
}
</style>
