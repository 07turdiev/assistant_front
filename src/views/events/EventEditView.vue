<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <el-button :icon="ArrowLeft" @click="$router.back()">{{ $t('common.back') }}</el-button>
        <span>{{ $t('event.edit') }}</span>
      </div>
    </template>

    <EventForm
      v-if="event"
      :event="event"
      :is-create="false"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="$router.back()"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import EventForm from '@/components/event/EventForm.vue'
import { eventsApi } from '@/api/events'
import type { Event, Visitor } from '@/types/event'
import { showApiError } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const event = ref<Event | null>(null)
const loading = ref(true)
const submitting = ref(false)

interface SubmitPayload {
  dto: {
    title: string
    date: string
    start_time: string
    end_time: string
    address: string
    hall_id: number | null
    region_id: number | null
    district_id: number | null
    description: string
    sphere: string
    type: string
    is_important: boolean
    is_private: boolean
    direction_id: string
    participant_ids: string[]
    notify_time_list: number[]
    visitors: Visitor[]
  }
  files: File[]
  deletedFileIds: string[]
}

async function load() {
  loading.value = true
  try {
    const id = route.params.id as string
    const { data } = await eventsApi.retrieve(id)
    event.value = data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

async function onSubmit(payload: SubmitPayload) {
  if (!event.value) return
  submitting.value = true
  try {
    const dto = { ...payload.dto, deleted_file_ids: payload.deletedFileIds }
    const fd = new FormData()
    fd.append('dto', JSON.stringify(dto))
    for (const f of payload.files) fd.append('files', f)

    const { data } = await eventsApi.update(event.value.id, fd)
    ElMessage.success(t('common.success'))
    router.push({ name: 'events.detail', params: { id: data.id } })
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
