<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <div>
          <h2 class="page-title"><el-icon class="page-title__icon"><Document /></el-icon> Topshiriq qoralamasi</h2>
          <div v-if="draft" style="font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px">
            <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
            <span style="margin-left: 8px">Yaratuvchi: {{ creatorName }}</span>
          </div>
        </div>
        <el-button @click="$router.push({ name: 'drafts.list' })">Orqaga</el-button>
      </div>
    </template>

    <el-result
      v-if="notFound"
      icon="warning"
      title="Qoralama topilmadi yoki ruxsat yo'q"
      sub-title="Bu qoralama o'chirilgan, muddati o'tgan, yoki sizga tayinlanmagan bo'lishi mumkin. Telegram'dagi havola boshqa xodimga yo'naltirilgan bo'lishi ham mumkin."
    >
      <template #extra>
        <el-button type="primary" @click="$router.push({ name: 'drafts.list' })">Mening qoralamalarim</el-button>
      </template>
    </el-result>

    <div v-if="draft && draft.raw_transcript" class="transcript">
      <div class="transcript-label">
        <el-icon class="transcript-label__icon"><Microphone /></el-icon>
        Asl ovozli matn:
      </div>
      <div class="transcript-text">«{{ draft.raw_transcript }}»</div>
      <audio v-if="draft.voice_file_url" :src="draft.voice_file_url" controls style="margin-top: 8px; width: 100%" />
    </div>

    <el-form v-if="draft" :model="form" label-position="top" :disabled="!canEdit">
      <el-form-item label="Sarlavha" required>
        <el-input v-model="form.title" maxlength="255" />
      </el-form-item>

      <el-form-item label="Topshiriq matni" required>
        <el-input v-model="form.description" type="textarea" :rows="5" />
      </el-form-item>

      <el-form-item label="Muddat (matn ko'rinishida)">
        <el-input v-model="form.deadline_text" placeholder="Masalan: 3 kun ichida, juma kuniga..." />
      </el-form-item>

      <el-form-item label="Tayinlanadi" required>
        <el-select
          v-model="form.assigned_to"
          filterable
          remote
          :remote-method="searchUsers"
          :loading="userSearchLoading"
          placeholder="Ism bilan qidiring"
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
          AI quyidagi ismlarni topa olmadi: {{ draft.unresolved_participant_names.join(', ') }}
        </div>
      </el-form-item>

      <el-form-item label="Qo'shimcha javobgar shaxslar (ixtiyoriy)">
        <el-select
          v-model="form.suggested_participants"
          multiple
          filterable
          remote
          :remote-method="searchUsers"
          :loading="userSearchLoading"
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

      <el-form-item>
        <el-checkbox v-model="form.is_important">
          <el-icon class="cb-icon cb-icon--danger"><StarFilled /></el-icon>
          Muhim
        </el-checkbox>
      </el-form-item>
    </el-form>

    <div v-if="canEdit" class="actions">
      <el-button :icon="FolderChecked" @click="onSave" :loading="saving">Saqlash</el-button>
      <el-button :icon="Check" type="success" @click="onPublish" :loading="publishing">Joylash</el-button>
      <el-popconfirm
        title="Qoralamani rad etishni xohlaysizmi?"
        confirm-button-text="Rad etish"
        cancel-button-text="Bekor"
        @confirm="onReject"
      >
        <template #reference>
          <el-button :icon="CircleClose" type="danger">Rad etish</el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check,
  CircleClose,
  Document,
  FolderChecked,
  Microphone,
  StarFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { AxiosError } from 'axios'
import { reportDraftsApi } from '@/api/drafts'
import { usersApi } from '@/api'
import type { ReportDraft, DraftStatus } from '@/types/draft'
import type { User } from '@/types/user'
import { showApiError } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()

const draft = ref<ReportDraft | null>(null)
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const notFound = ref(false)
const userOptions = ref<User[]>([])
const userSearchLoading = ref(false)

const form = reactive({
  title: '',
  description: '',
  deadline_text: '',
  assigned_to: null as string | null,
  suggested_participants: [] as string[],
  is_important: false,
})

const canEdit = computed(() => draft.value?.status === 'PENDING_REVIEW')

const statusType = computed(() => ({
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'info',
  EXPIRED: 'danger',
}[draft.value?.status as DraftStatus] || undefined) as 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined)

const statusLabel = computed(() => ({
  PENDING_REVIEW: 'Tahrir kutilmoqda',
  PUBLISHED: 'Joylangan',
  REJECTED: 'Rad etilgan',
  EXPIRED: "Muddati o'tgan",
}[draft.value?.status as DraftStatus] || ''))

const creatorName = computed(() => {
  const u = draft.value?.created_by
  return u ? `${u.last_name} ${u.first_name}` : ''
})

async function loadDraft() {
  loading.value = true
  notFound.value = false
  try {
    const { data } = await reportDraftsApi.retrieve(route.params.id as string)
    draft.value = data
    fillForm(data)
    seedUserOptions(data)
  } catch (e: unknown) {
    const status = (e as AxiosError)?.response?.status
    if (status === 404 || status === 403) {
      notFound.value = true
    } else {
      showApiError(e, 'Qoralamani yuklashda xato')
    }
  } finally {
    loading.value = false
  }
}

function fillForm(d: ReportDraft) {
  form.title = d.title
  form.description = d.description
  form.deadline_text = d.deadline_text
  form.assigned_to = d.assigned_to?.id || null
  form.suggested_participants = d.suggested_participants.map((u) => u.id)
  form.is_important = d.is_important
}

function seedUserOptions(d: ReportDraft) {
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

async function onSave() {
  if (!draft.value) return
  saving.value = true
  try {
    const { data } = await reportDraftsApi.update(draft.value.id, { ...form })
    draft.value = data
    fillForm(data)
    ElMessage.success('Saqlandi')
  } catch (e: unknown) {
    showApiError(e, 'Saqlashda xato')
  } finally {
    saving.value = false
  }
}

async function onPublish() {
  if (!draft.value) return
  await onSave()
  publishing.value = true
  try {
    await reportDraftsApi.publish(draft.value.id)
    ElMessage.success('Topshiriq muvaffaqiyatli joylandi')
    router.push({ name: 'drafts.list' })
  } catch (e: unknown) {
    showApiError(e, 'Joylashda xato')
  } finally {
    publishing.value = false
  }
}

async function onReject() {
  if (!draft.value) return
  try {
    const { data } = await reportDraftsApi.reject(draft.value.id, 'Foydalanuvchi rad etdi')
    draft.value = data
    ElMessage.info('Qoralama rad etildi')
  } catch (e: unknown) {
    showApiError(e, 'Rad etishda xato')
  }
}

onMounted(loadDraft)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
