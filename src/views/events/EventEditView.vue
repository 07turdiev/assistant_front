<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('event.edit') }}</span>
        <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
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
import { useI18n } from 'vue-i18n'
import EventForm from '@/components/event/EventForm.vue'
import { eventsApi } from '@/api/events'
import type { Event, Visitor } from '@/types/event'

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
    description: string
    sphere: string
    type: string
    is_important: boolean
    is_private: boolean
    speaker_id: string
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
  } catch (_e) {
    ElMessage.error(t('common.error'))
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
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    submitting.value = false
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
