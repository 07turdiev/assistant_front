<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('nav.preEvents') }}</span>
        <el-button type="primary" @click="openCreate">{{ $t('preEvent.create') }}</el-button>
      </div>
    </template>

    <el-empty v-if="items.length === 0" :description="$t('preEvent.empty')" />

    <el-table v-else :data="items" stripe>
      <el-table-column prop="title" :label="$t('event.title')" />
      <el-table-column :label="$t('event.date')" width="140">
        <template #default="{ row }">{{ formatDate(row.date) }}</template>
      </el-table-column>
      <el-table-column :label="$t('event.startTime')" width="180">
        <template #default="{ row }">{{ formatDateTime(row.start_time) }}</template>
      </el-table-column>
      <el-table-column :label="$t('event.endTime')" width="180">
        <template #default="{ row }">{{ formatDateTime(row.end_time) }}</template>
      </el-table-column>
      <el-table-column prop="description" :label="$t('event.description')" />
      <el-table-column :label="$t('common.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? $t('preEvent.edit') : $t('preEvent.create')" width="560px">
      <el-form :model="form" label-position="top">
        <el-form-item :label="$t('event.title')" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item :label="$t('event.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('event.date')" required>
              <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('event.startTime')" required>
              <el-date-picker
                v-model="form.start_time"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('event.endTime')" required>
              <el-date-picker
                v-model="form.end_time"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
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
import { useI18n } from 'vue-i18n'
import { preEventsApi, type PreEvent, type PreEventPayload } from '@/api/preEvents'
import { formatDate, formatDateTime } from '@/utils/date'

const { t } = useI18n()

const items = ref<PreEvent[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<PreEvent | null>(null)

const form = reactive<PreEventPayload>({
  title: '',
  description: '',
  date: '',
  start_time: '',
  end_time: '',
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.date = ''
  form.start_time = ''
  form.end_time = ''
}

async function load() {
  loading.value = true
  try {
    const { data } = await preEventsApi.list({ page: 1, page_size: 100 })
    items.value = data.results
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

function openEdit(row: PreEvent) {
  editing.value = row
  form.title = row.title
  form.description = row.description || ''
  form.date = row.date
  form.start_time = row.start_time
  form.end_time = row.end_time
  dialogVisible.value = true
}

async function onSave() {
  if (!form.title.trim() || !form.date || !form.start_time || !form.end_time) {
    ElMessage.warning(t('common.required'))
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await preEventsApi.update(editing.value.id, { ...form })
    } else {
      await preEventsApi.create({ ...form })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: PreEvent) {
  await ElMessageBox.confirm(t('preEvent.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await preEventsApi.delete(row.id)
    ElMessage.success(t('common.success'))
    await load()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
