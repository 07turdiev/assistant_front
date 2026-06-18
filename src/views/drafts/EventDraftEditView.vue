<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <el-button :icon="ArrowLeft" @click="$router.push({ name: 'drafts.list' })">{{ $t('common.back') }}</el-button>
        <div class="header__title-block">
          <h2 class="page-title"><el-icon class="page-title__icon"><Calendar /></el-icon> {{ $t('drafts.eventDraftTitle') }}</h2>
          <div v-if="draft" style="font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px">
            <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
            <span style="margin-left: 8px">{{ $t('drafts.createdBy') }} {{ creatorName }}</span>
          </div>
        </div>
      </div>
    </template>

    <el-result
      v-if="notFound"
      icon="warning"
      :title="$t('drafts.notFound')"
      :sub-title="$t('drafts.notFoundMessage')"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push({ name: 'drafts.list' })">{{ $t('drafts.myDrafts') }}</el-button>
      </template>
    </el-result>

    <div v-if="draft && draft.raw_transcript" class="transcript">
      <div class="transcript-label">
        <el-icon class="transcript-label__icon"><Microphone /></el-icon>
        {{ $t('drafts.originalTranscript') }}
      </div>
      <div class="transcript-text">«{{ draft.raw_transcript }}»</div>
      <audio v-if="draft.voice_file_url" :src="draft.voice_file_url" controls style="margin-top: 8px; width: 100%" />
    </div>

    <el-form
      v-if="draft"
      ref="formRef"
      :model="form"
      label-position="top"
      :disabled="!canEdit"
    >
      <el-form-item :label="$t('event.title')" required>
        <el-input v-model="form.title" maxlength="255" />
      </el-form-item>

      <el-form-item :label="$t('event.description')">
        <el-input v-model="form.description" type="textarea" :rows="3" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item :label="$t('event.date')" required>
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('event.startTime')" required>
            <el-time-picker v-model="form.start_time" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('event.endTime')" required>
            <el-time-picker v-model="form.end_time" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('event.address')">
        <el-input v-model="form.location" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$t('event.sphere')" required>
            <el-select v-model="form.sphere" filterable style="width: 100%">
              <el-option v-for="s in spheres" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('event.type')" required>
            <el-select v-model="form.event_type" style="width: 100%">
              <el-option v-for="et in eventTypes" :key="et.value" :label="et.label" :value="et.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('event.assignedTo')">
        <el-select
          v-model="form.assigned_to"
          filterable
          remote
          :remote-method="searchUsers"
          :loading="userSearchLoading"
          :placeholder="$t('drafts.searchByName')"
          style="width: 100%"
        >
          <el-option
            v-for="u in userOptions"
            :key="u.id"
            :label="`${u.last_name} ${u.first_name}`"
            :value="u.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('event.participants')">
        <el-select
          v-model="form.suggested_participants"
          multiple
          filterable
          remote
          :remote-method="searchUsers"
          :loading="userSearchLoading"
          :placeholder="$t('drafts.searchByName')"
          style="width: 100%"
        >
          <el-option
            v-for="u in userOptions"
            :key="u.id"
            :label="`${u.last_name} ${u.first_name}`"
            :value="u.id"
          />
        </el-select>
        <div v-if="draft.unresolved_participant_names.length" class="unresolved">
          <el-icon class="unresolved__icon"><WarningFilled /></el-icon>
          {{ $t('drafts.unresolvedParticipants') }} {{ draft.unresolved_participant_names.join(', ') }}
        </div>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item>
            <el-checkbox v-model="form.is_important">
              <el-icon class="cb-icon cb-icon--danger"><StarFilled /></el-icon>
              {{ $t('event.important') }}
            </el-checkbox>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item>
            <el-checkbox v-model="form.is_private">
              <el-icon class="cb-icon"><Lock /></el-icon>
              {{ $t('event.private') }}
            </el-checkbox>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div v-if="canEdit" class="actions">
      <el-button :icon="FolderChecked" @click="onSave" :loading="saving">{{ $t('common.save') }}</el-button>
      <el-button :icon="Check" type="success" @click="onPublish" :loading="publishing">{{ $t('drafts.publish') }}</el-button>
      <el-popconfirm
        :title="$t('drafts.confirmReject')"
        :confirm-button-text="$t('drafts.reject')"
        :cancel-button-text="$t('common.cancel')"
        @confirm="onReject"
      >
        <template #reference>
          <el-button :icon="CircleClose" type="danger">{{ $t('drafts.reject') }}</el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Calendar,
  Check,
  CircleClose,
  FolderChecked,
  Lock,
  Microphone,
  StarFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { AxiosError } from 'axios'
import { eventDraftsApi } from '@/api/drafts'
import { infoApi, usersApi } from '@/api'
import type { EventDraft, DraftStatus } from '@/types/draft'
import type { User } from '@/types/user'
import { showApiError } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const draft = ref<EventDraft | null>(null)
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const notFound = ref(false)
const userOptions = ref<User[]>([])
const userSearchLoading = ref(false)
const spheres = ref<{ value: string; label: string }[]>([])
const eventTypes = ref<{ value: string; label: string }[]>([])

const form = reactive({
  title: '',
  description: '',
  date: '' as string | null,
  start_time: '' as string | null,
  end_time: '' as string | null,
  location: '',
  sphere: '',
  event_type: '',
  assigned_to: null as string | null,
  suggested_participants: [] as string[],
  is_important: false,
  is_private: false,
})

const canEdit = computed(() => draft.value?.status === 'PENDING_REVIEW')

const statusType = computed(() => ({
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'info',
  EXPIRED: 'danger',
}[draft.value?.status as DraftStatus] || undefined) as 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined)

const statusLabel = computed(() => ({
  PENDING_REVIEW: t('drafts.statusPendingReview'),
  PUBLISHED: t('drafts.statusPublished'),
  REJECTED: t('drafts.statusRejected'),
  EXPIRED: t('drafts.statusExpired'),
}[draft.value?.status as DraftStatus] || ''))

const creatorName = computed(() => {
  const u = draft.value?.created_by
  return u ? `${u.last_name} ${u.first_name}` : ''
})

async function loadDraft() {
  loading.value = true
  notFound.value = false
  try {
    const { data } = await eventDraftsApi.retrieve(route.params.id as string)
    draft.value = data
    fillForm(data)
    seedUserOptions(data)
  } catch (e: unknown) {
    const status = (e as AxiosError)?.response?.status
    if (status === 404 || status === 403) {
      notFound.value = true
    } else {
      showApiError(e, t('drafts.loadError'))
    }
  } finally {
    loading.value = false
  }
}

function fillForm(d: EventDraft) {
  form.title = d.title
  form.description = d.description
  form.date = d.date
  form.start_time = d.start_time
  form.end_time = d.end_time
  form.location = d.location
  form.sphere = d.sphere
  form.event_type = d.event_type
  form.assigned_to = d.assigned_to?.id || null
  form.suggested_participants = d.suggested_participants.map((u) => u.id)
  form.is_important = d.is_important
  form.is_private = d.is_private
}

function seedUserOptions(d: EventDraft) {
  const seen = new Map<string, User>()
  for (const u of [d.assigned_to, ...d.suggested_participants]) {
    if (u && !seen.has(u.id)) seen.set(u.id, u as unknown as User)
  }
  userOptions.value = Array.from(seen.values())
}

async function searchUsers(query: string) {
  if (!query) return
  userSearchLoading.value = true
  try {
    const { data } = await usersApi.participants({ search: query })
    userOptions.value = data
  } finally {
    userSearchLoading.value = false
  }
}

async function loadChoices() {
  try {
    const [s, ty] = await Promise.all([infoApi.spheres(), infoApi.types()])
    spheres.value = s.data
    eventTypes.value = ty.data
  } catch {}
}

async function onSave() {
  if (!draft.value) return
  saving.value = true
  try {
    const { data } = await eventDraftsApi.update(draft.value.id, { ...form })
    draft.value = data
    fillForm(data)
    ElMessage.success(t('drafts.saved'))
  } catch (e: unknown) {
    showApiError(e, t('drafts.saveError'))
  } finally {
    saving.value = false
  }
}

async function onPublish() {
  if (!draft.value) return
  await onSave()
  publishing.value = true
  try {
    const { data } = await eventDraftsApi.publish(draft.value.id)
    ElMessage.success(t('drafts.eventPublished'))
    router.push({ name: 'events.detail', params: { id: data.event.id } })
  } catch (e: unknown) {
    showApiError(e, t('drafts.publishError'))
  } finally {
    publishing.value = false
  }
}

async function onReject() {
  if (!draft.value) return
  try {
    const { data } = await eventDraftsApi.reject(draft.value.id, t('drafts.userRejected'))
    draft.value = data
    ElMessage.info(t('drafts.rejected'))
  } catch (e: unknown) {
    showApiError(e, t('drafts.rejectError'))
  }
}

onMounted(() => {
  loadChoices()
  loadDraft()
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header__title-block {
  flex: 1;
  min-width: 0;
}
.transcript {
  background: var(--el-fill-color-light);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.transcript-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  margin-bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.transcript-label__icon {
  color: var(--el-color-primary);
}
.page-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.page-title__icon {
  color: var(--el-color-primary);
  font-size: 22px;
}
.cb-icon {
  margin-right: 4px;
  vertical-align: -2px;
}
.cb-icon--danger {
  color: var(--el-color-danger);
}
.unresolved__icon {
  margin-right: 4px;
  vertical-align: -2px;
  color: var(--el-color-warning);
}
.transcript-text {
  font-style: italic;
  color: var(--el-text-color-primary);
}
.unresolved {
  color: var(--el-color-warning);
  font-size: 12px;
  margin-top: 6px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
