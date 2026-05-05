<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <div>
          <h2 style="margin: 0">📅 Tadbir qoralamasi</h2>
          <div v-if="draft" style="font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px">
            <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
            <span style="margin-left: 8px">Yaratuvchi: {{ creatorName }}</span>
          </div>
        </div>
        <el-button @click="$router.push({ name: 'drafts.list' })">Orqaga</el-button>
      </div>
    </template>

    <div v-if="draft && draft.raw_transcript" class="transcript">
      <div class="transcript-label">🎤 Asl ovozli matn:</div>
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
      <el-form-item label="Sarlavha" required>
        <el-input v-model="form.title" maxlength="255" />
      </el-form-item>

      <el-form-item label="Tavsif">
        <el-input v-model="form.description" type="textarea" :rows="3" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="Sana" required>
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Boshlanish" required>
            <el-time-picker v-model="form.start_time" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Tugash" required>
            <el-time-picker v-model="form.end_time" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Manzil">
        <el-input v-model="form.location" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Soha" required>
            <el-select v-model="form.sphere" filterable style="width: 100%">
              <el-option v-for="s in spheres" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Tadbir turi" required>
            <el-select v-model="form.event_type" style="width: 100%">
              <el-option v-for="t in eventTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Ma'ruzachi" required>
            <el-select
              v-model="form.speaker"
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
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Tayinlanadi (asosiy javobgar)">
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
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Qatnashchilar">
        <el-select
          v-model="form.suggested_participants"
          multiple
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
          ⚠️ AI quyidagi ismlarni topa olmadi: {{ draft.unresolved_participant_names.join(', ') }}
        </div>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item>
            <el-checkbox v-model="form.is_important">🔴 Muhim</el-checkbox>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item>
            <el-checkbox v-model="form.is_private">🔒 Yopiq</el-checkbox>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div v-if="canEdit" class="actions">
      <el-button @click="onSave" :loading="saving">💾 Saqlash</el-button>
      <el-button type="success" @click="onPublish" :loading="publishing">✅ Joylash</el-button>
      <el-popconfirm
        title="Qoralamani rad etishni xohlaysizmi?"
        confirm-button-text="Rad etish"
        cancel-button-text="Bekor"
        @confirm="onReject"
      >
        <template #reference>
          <el-button type="danger">🛑 Rad etish</el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { eventDraftsApi } from '@/api/drafts'
import { infoApi, usersApi } from '@/api'
import type { EventDraft, DraftStatus } from '@/types/draft'
import type { User } from '@/types/user'

const route = useRoute()
const router = useRouter()

const draft = ref<EventDraft | null>(null)
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
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
  speaker: null as string | null,
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
  try {
    const { data } = await eventDraftsApi.retrieve(route.params.id as string)
    draft.value = data
    fillForm(data)
    seedUserOptions(data)
  } catch {
    ElMessage.error('Qoralamani yuklashda xato')
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
  form.speaker = d.speaker?.id || null
  form.assigned_to = d.assigned_to?.id || null
  form.suggested_participants = d.suggested_participants.map((u) => u.id)
  form.is_important = d.is_important
  form.is_private = d.is_private
}

function seedUserOptions(d: EventDraft) {
  const seen = new Map<string, User>()
  for (const u of [d.speaker, d.assigned_to, ...d.suggested_participants]) {
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
    const [s, t] = await Promise.all([infoApi.spheres(), infoApi.types()])
    spheres.value = s.data
    eventTypes.value = t.data
  } catch {}
}

async function onSave() {
  if (!draft.value) return
  saving.value = true
  try {
    const { data } = await eventDraftsApi.update(draft.value.id, { ...form })
    draft.value = data
    fillForm(data)
    ElMessage.success('Saqlandi')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || 'Saqlashda xato')
  } finally {
    saving.value = false
  }
}

async function onPublish() {
  if (!draft.value) return
  // Avval saqlash, keyin publish
  await onSave()
  publishing.value = true
  try {
    const { data } = await eventDraftsApi.publish(draft.value.id)
    ElMessage.success('Tadbir muvaffaqiyatli joylandi')
    router.push({ name: 'events.detail', params: { id: data.event.id } })
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || 'Joylashda xato')
  } finally {
    publishing.value = false
  }
}

async function onReject() {
  if (!draft.value) return
  try {
    const { data } = await eventDraftsApi.reject(draft.value.id, 'Foydalanuvchi rad etdi')
    draft.value = data
    ElMessage.info('Qoralama rad etildi')
  } catch {
    ElMessage.error('Rad etishda xato')
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
