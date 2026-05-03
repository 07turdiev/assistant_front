<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>{{ $t('event.create') }}</span>
        <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
      </div>
    </template>

    <EventForm :is-create="true" :submitting="submitting" @submit="onSubmit" @cancel="$router.back()" />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import EventForm from '@/components/event/EventForm.vue'
import { eventsApi } from '@/api/events'

const router = useRouter()
const { t } = useI18n()
const submitting = ref(false)

interface Visitor {
  full_name: string
  organisation_name: string
  position: string
}

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

async function onSubmit(payload: SubmitPayload) {
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('dto', JSON.stringify(payload.dto))
    for (const f of payload.files) fd.append('files', f)

    const { data } = await eventsApi.create(fd)
    ElMessage.success(t('common.success'))
    router.push({ name: 'events.detail', params: { id: data.id } })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
