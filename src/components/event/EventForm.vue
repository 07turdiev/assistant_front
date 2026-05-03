<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
    <h2 class="form-title">{{ $t('event.formTitle') }}</h2>
    <el-divider class="title-divider" />

    <!-- Sana, Tugash vaqti, Mavzusi -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('event.executionDate')" prop="date" required>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.endTime')" prop="end_time" required>
          <el-time-picker v-model="form.end_time" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.subject')" prop="title" required>
          <el-input v-model="form.title" :placeholder="$t('event.subject')" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-form-item :label="$t('event.content')">
          <el-input v-model="form.description" type="textarea" :rows="5" :placeholder="$t('event.contentHint')" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.closed')">
          <div class="toggle-pair">
            <el-button :type="form.is_private ? 'primary' : ''" :plain="!form.is_private" class="toggle-btn" @click="form.is_private = true">
              {{ $t('common.yes') }}
            </el-button>
            <el-button :type="!form.is_private ? 'primary' : ''" :plain="form.is_private" class="toggle-btn" @click="form.is_private = false">
              {{ $t('common.no') }}
            </el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('event.executionType')" prop="type" required>
          <el-select v-model="form.type" :placeholder="$t('event.executionType')" style="width: 100%">
            <el-option v-for="t in lookup.types" :key="t.value" :value="t.value" :label="t.label" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.importantToggle')">
          <div class="toggle-pair">
            <el-button :type="form.is_important ? 'primary' : ''" :plain="!form.is_important" class="toggle-btn" @click="form.is_important = true">
              {{ $t('common.yes') }}
            </el-button>
            <el-button :type="!form.is_important ? 'primary' : ''" :plain="form.is_important" class="toggle-btn" @click="form.is_important = false">
              {{ $t('common.no') }}
            </el-button>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.reminderTime')">
          <el-select v-model="reminderMinutes" style="width: 100%">
            <el-option v-for="opt in reminderOptions" :key="opt" :value="opt" :label="reminderLabel(opt)" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item>
      <el-upload class="big-upload" :auto-upload="false" :file-list="newFiles" :on-change="onFileChange" :on-remove="onFileRemove" multiple list-type="picture-card">
        <el-icon class="upload-icon"><DocumentAdd /></el-icon>
      </el-upload>
    </el-form-item>

    <div v-if="existingFiles.length > 0" class="existing-files">
      <p class="muted">{{ $t('event.existingFiles') }}</p>
      <div v-for="f in existingFiles" :key="f.id" class="existing-file">
        <a :href="f.url" target="_blank">📎 {{ f.file_name }}</a>
        <el-button size="small" type="danger" link @click="markFileForDeletion(f.id)">×</el-button>
      </div>
    </div>

    <h3 class="section-title">{{ $t('event.executors') }}</h3>
    <el-divider class="title-divider" />

    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('event.search')">
          <el-input v-model="participantSearch" :placeholder="$t('event.searchHint')" @input="onParticipantSearch" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.organisation')">
          <el-select v-model="filterOrganisationId" clearable style="width: 100%" @change="reloadParticipants">
            <el-option v-for="o in organisations" :key="o.id" :value="o.id" :label="locale === 'ru' ? o.name_ru : o.name_uz" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.direction')">
          <el-select v-model="filterDirectionId" clearable style="width: 100%" @change="reloadParticipants">
            <el-option v-for="d in directions" :key="d.id" :value="d.id" :label="locale === 'ru' ? d.name_ru : d.name_uz" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item v-if="form.participant_ids.length > 0">
      <div class="participants-tags">
        <el-tag v-for="pid in form.participant_ids" :key="pid" closable @close="removeParticipant(pid)">
          {{ formatUser(participantMap[pid]) }}
        </el-tag>
      </div>
    </el-form-item>

    <el-form-item v-if="participantOptions.length > 0">
      <p class="muted">{{ $t('event.searchResults') }} ({{ participantOptions.length }}):</p>
      <div class="participants-list">
        <div v-for="u in participantOptions" :key="u.id" class="participant-row" :class="{ selected: form.participant_ids.includes(u.id) }" @click="toggleParticipant(u)">
          <el-avatar :size="28" :src="u.avatar_url || undefined">{{ initials(u) }}</el-avatar>
          <span>{{ formatUser(u) }}</span>
          <el-icon v-if="form.participant_ids.includes(u.id)"><Check /></el-icon>
        </div>
      </div>
    </el-form-item>

    <div class="actions">
      <el-button type="primary" native-type="submit" :loading="submitting">
        {{ $t('event.submitBtn') }}
      </el-button>
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Check, DocumentAdd } from '@element-plus/icons-vue'
import { useLookupStore } from '@/stores/lookup'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { adminDirectionsApi, adminOrganisationsApi, type Direction, type Organisation } from '@/api/admin'
import { fullName } from '@/utils/format'
import type { Event, Visitor, Attachment } from '@/types/event'
import type { User } from '@/types/user'

interface FormShape {
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

const props = defineProps<{
  event?: Event | null
  isCreate: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { dto: FormShape; files: File[]; deletedFileIds: string[] }]
  cancel: []
}>()

const { t, locale } = useI18n()
const lookup = useLookupStore()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

const reminderOptions = [5, 10, 15, 30, 60, 120, 1440]
const reminderMinutes = ref<number>(5)

function reminderLabel(min: number): string {
  if (min >= 1440) return t('event.reminder.day', { n: Math.floor(min / 1440) })
  if (min >= 60) return t('event.reminder.hour', { n: Math.floor(min / 60) })
  return t('event.reminder.min', { n: min })
}

const form = reactive<FormShape>({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  address: '',
  description: '',
  sphere: 'VARIOUS_QUESTIONS',
  type: '',
  is_important: false,
  is_private: false,
  speaker_id: '',
  direction_id: '',
  participant_ids: [],
  notify_time_list: [5],
  visitors: [],
})

const participantOptions = ref<User[]>([])
const participantMap = ref<Record<string, User>>({})
const directions = ref<Direction[]>([])
const organisations = ref<Organisation[]>([])

const participantSearch = ref('')
const filterOrganisationId = ref<string>('')
const filterDirectionId = ref<string>('')

const newFiles = ref<UploadFile[]>([])
const existingFiles = ref<Attachment[]>([])
const deletedFileIds = ref<string[]>([])

const rules: FormRules = {
  title: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  date: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  end_time: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
}

function formatUser(u: User | undefined | null): string {
  return u ? fullName(u) : ''
}

function initials(u: User): string {
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

let participantTimer: number | null = null
function onParticipantSearch() {
  if (participantTimer) clearTimeout(participantTimer)
  participantTimer = window.setTimeout(reloadParticipants, 300)
}

async function reloadParticipants() {
  try {
    const params: Record<string, string | number> = { page_size: 50 }
    if (participantSearch.value.trim()) params.search = participantSearch.value.trim()
    if (filterOrganisationId.value) params.organisation_id = filterOrganisationId.value
    if (filterDirectionId.value) params.direction_id = filterDirectionId.value
    const { data } = await usersApi.list(params)
    participantOptions.value = data.results
    for (const u of data.results) participantMap.value[u.id] = u
  } catch (_e) {
    participantOptions.value = []
  }
}

async function loadLookups() {
  const [d, o] = await Promise.all([
    adminDirectionsApi.list({ page_size: 200 }),
    adminOrganisationsApi.list({ page_size: 200 }),
  ])
  directions.value = d.data.results || []
  organisations.value = o.data.results || []
}

function toggleParticipant(u: User) {
  participantMap.value[u.id] = u
  const i = form.participant_ids.indexOf(u.id)
  if (i >= 0) form.participant_ids.splice(i, 1)
  else form.participant_ids.push(u.id)
}

function removeParticipant(id: string) {
  const i = form.participant_ids.indexOf(id)
  if (i >= 0) form.participant_ids.splice(i, 1)
}

function onFileChange(file: UploadFile) {
  if (!newFiles.value.find((f) => f.uid === file.uid)) {
    newFiles.value.push(file)
  }
}

function onFileRemove(file: UploadFile) {
  newFiles.value = newFiles.value.filter((f) => f.uid !== file.uid)
}

function markFileForDeletion(id: string) {
  deletedFileIds.value.push(id)
  existingFiles.value = existingFiles.value.filter((f) => f.id !== id)
}

watch(
  () => props.event,
  (e) => {
    if (!e) return
    form.title = e.title
    form.date = e.date
    form.start_time = e.start_time?.slice(0, 5)
    form.end_time = e.end_time?.slice(0, 5)
    form.address = e.address || ''
    form.description = e.description || ''
    form.sphere = e.sphere || 'VARIOUS_QUESTIONS'
    form.type = e.type
    form.is_important = e.is_important
    form.is_private = e.is_private
    form.speaker_id = e.speaker?.id || ''
    form.participant_ids = e.participants?.map((p) => p.id) || []
    form.notify_time_list = [...(e.notify_time || [5])]
    form.visitors = (e.visitors || []).map((v) => ({ ...v }))
    existingFiles.value = e.files || []

    reminderMinutes.value = form.notify_time_list[0] || 5

    for (const p of e.participants || []) {
      participantMap.value[p.id] = p
    }
    if (e.speaker) participantMap.value[e.speaker.id] = e.speaker
  },
  { immediate: true }
)

async function onSubmit() {
  if (!formRef.value) return

  // Production'da yashirin field'lar uchun default
  if (!form.start_time) form.start_time = '09:00'
  if (!form.speaker_id && auth.user) form.speaker_id = auth.user.id
  if (!form.direction_id && auth.user?.direction_id) form.direction_id = auth.user.direction_id
  form.notify_time_list = [reminderMinutes.value]

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.participant_ids.length === 0) return

  emit('submit', {
    dto: { ...form },
    files: newFiles.value.map((f) => f.raw as File).filter(Boolean),
    deletedFileIds: [...deletedFileIds.value],
  })
}

onMounted(async () => {
  await Promise.all([
    lookup.loadAll(),
    loadLookups(),
    reloadParticipants(),
  ])
})
</script>

<style lang="scss" scoped>
.form-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 500;
}

.section-title {
  margin: 24px 0 4px;
  font-size: 18px;
  font-weight: 500;
}

.title-divider {
  margin: 0 0 20px !important;
}

.toggle-pair {
  display: flex;
  width: 100%;

  .toggle-btn {
    flex: 1;
    border-radius: 0;
    margin-left: 0 !important;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}

.big-upload {
  :deep(.el-upload--picture-card) {
    width: 110px;
    height: 110px;
    background: #ecf5ff;
    border: 1px dashed transparent;
    color: #409eff;
  }

  .upload-icon {
    font-size: 36px;
  }
}

.existing-files {
  margin: 12px 0;

  .existing-file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 4px;

    a {
      color: #409eff;
      text-decoration: none;
    }
  }
}

.participants-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.participants-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-top: 8px;
}

.participant-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
  transition: background 0.15s;

  &:last-child { border-bottom: none; }
  &:hover { background: #f5f7fa; }
  &.selected { background: #ecf5ff; color: #1976d2; }
}

.muted {
  color: #909399;
  font-size: 13px;
  margin: 4px 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}
</style>
