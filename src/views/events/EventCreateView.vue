<template>
  <el-card>
    <template #header>
      <div class="header">
        <el-button :icon="ArrowLeft" @click="$router.back()">{{ $t('common.back') }}</el-button>
        <span>{{ $t('event.create') }}</span>
      </div>
    </template>

    <OnBehalfBanner style="margin-bottom: 16px" />
    <EventForm :is-create="true" :submitting="submitting" @submit="onSubmit" @cancel="$router.back()" />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import EventForm from '@/components/event/EventForm.vue'
import OnBehalfBanner from '@/components/common/OnBehalfBanner.vue'
import { eventsApi } from '@/api/events'
import { showApiError } from '@/utils/api-error'

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
    showApiError(e, t('common.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
