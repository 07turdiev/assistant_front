<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
    <h2 class="form-title">{{ $t('event.formTitle') }}</h2>
    <el-divider class="title-divider" />

    <!-- Sana, Boshlanish vaqti, Tugash vaqti, Mavzusi -->
    <el-row :gutter="24">
      <el-col :span="6">
        <el-form-item :label="$t('event.executionDate')" prop="date" required>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('event.startTime')" prop="start_time" required>
          <el-time-picker v-model="form.start_time" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('event.endTime')" prop="end_time">
          <el-time-picker v-model="form.end_time" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
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
        <el-tag
          v-for="pid in form.participant_ids"
          :key="pid"
          closable
          type="primary"
          effect="light"
          class="selected-tag"
          @close="removeParticipant(pid)"
        >
          <el-avatar :size="18" :src="participantMap[pid]?.avatar_url || undefined" class="tag-avatar">
            {{ participantMap[pid] ? initials(participantMap[pid]) : '' }}
          </el-avatar>
          {{ formatUser(participantMap[pid]) }}
        </el-tag>
      </div>
    </el-form-item>

    <el-form-item v-if="!filterDirectionId">
      <div class="participants-empty">
        <el-icon class="participants-empty__icon"><Search /></el-icon>
        <p class="participants-empty__text">{{ $t('event.selectDirectionFirst') }}</p>
      </div>
    </el-form-item>

    <el-form-item v-else-if="participantOptions.length === 0">
      <div class="participants-empty">
        <el-icon class="participants-empty__icon"><UserIcon /></el-icon>
        <p class="participants-empty__text">{{ $t('event.noEmployeesInDirection') }}</p>
      </div>
    </el-form-item>

    <el-form-item v-else>
      <div class="participants-header">
        <span class="participants-header__label">{{ $t('event.searchResults') }}</span>
        <el-tag size="small" type="info" effect="plain" round>{{ participantOptions.length }}</el-tag>
      </div>
      <div class="participants-list">
        <div
          v-for="u in participantOptions"
          :key="u.id"
          class="participant-row"
          :class="{
            'is-selected': form.participant_ids.includes(u.id),
            'is-subordinate': u.chief_id && form.participant_ids.includes(u.chief_id),
          }"
          @click="toggleParticipant(u)"
        >
          <el-avatar :size="36" :src="u.avatar_url || undefined" class="participant-row__avatar">
            {{ initials(u) }}
          </el-avatar>
          <div class="participant-row__info">
            <span class="participant-row__name">{{ formatUser(u) }}</span>
            <span v-if="u.position_uz" class="participant-row__position">{{ u.position_uz }}</span>
          </div>
          <el-tag
            v-if="u.chief_id && form.participant_ids.includes(u.chief_id)"
            size="small"
            type="success"
            effect="plain"
            class="participant-row__badge"
          >
            {{ $t('event.subordinateTag') }}
          </el-tag>
          <div class="participant-row__check">
            <el-icon v-if="form.participant_ids.includes(u.id)"><Check /></el-icon>
          </div>
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
import { Check, DocumentAdd, Search, User as UserIcon } from '@element-plus/icons-vue'
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
  start_time: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
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
  // Yo'nalish tanlanmagan bo'lsa hodimlar ko'rsatilmaydi
  if (!filterDirectionId.value) {
    participantOptions.value = []
    return
  }
  try {
    const params: { search?: string; organisation_id?: string; direction_id?: string } = {
      direction_id: filterDirectionId.value,
    }
    if (participantSearch.value.trim()) params.search = participantSearch.value.trim()
    if (filterOrganisationId.value) params.organisation_id = filterOrganisationId.value
    const { data } = await usersApi.participants(params)
    participantOptions.value = data
    for (const u of data) participantMap.value[u.id] = u
  } catch (_e) {
    participantOptions.value = []
  }
}

/** Foydalanuvchi tanlanganda — uning yordamchilarini fetch va auto-add qilish. */
async function fetchAndShowSubordinates(userId: string) {
  try {
    const { data } = await usersApi.subordinates(userId)
    if (data.length === 0) return
    for (const sub of data) {
      participantMap.value[sub.id] = sub
      // Subordinatlar suggestion sifatida participantOptions ga qo'shamiz (top'da bo'lsin)
      if (!participantOptions.value.find((u) => u.id === sub.id)) {
        participantOptions.value.unshift(sub)
      }
    }
  } catch (_e) { /* ignore */ }
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
  if (i >= 0) {
    form.participant_ids.splice(i, 1)
  } else {
    form.participant_ids.push(u.id)
    // Tanlangan foydalanuvchining yordamchilarini ro'yxatga qo'shamiz (production'dagidek)
    fetchAndShowSubordinates(u.id)
  }
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

  // Default speaker — joriy foydalanuvchi
  if (!form.speaker_id && auth.user) form.speaker_id = auth.user.id
  if (!form.direction_id && auth.user?.direction_id) form.direction_id = auth.user.direction_id
  form.notify_time_list = [reminderMinutes.value]

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.participant_ids.length === 0) return

  // end_time bo'sh bo'lsa — start_time + 1 soat (backend majburiy bo'lsa)
  const dto = { ...form }
  if (!dto.end_time && dto.start_time) {
    dto.end_time = addOneHour(dto.start_time)
  }

  emit('submit', {
    dto,
    files: newFiles.value.map((f) => f.raw as File).filter(Boolean),
    deletedFileIds: [...deletedFileIds.value],
  })
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hh = (h + 1) % 24
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([
    lookup.loadAll(),
    loadLookups(),
  ])
  // Edit rejimida yo'nalish allaqachon tanlangan bo'lsa avto-yuklash
  if (filterDirectionId.value) await reloadParticipants()
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
  gap: 8px;
  width: 100%;
}

.selected-tag {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px !important;
  height: auto !important;
  border-radius: 999px !important;
  font-size: 12px;
}

.tag-avatar {
  flex-shrink: 0;
  font-size: 9px;
}

.participants-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 8px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #5a6c7d;
  }
}

.participants-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  width: 100%;
  background: #fafbfc;
  border: 1px dashed #e4e7ed;
  border-radius: 10px;
  color: #909399;

  &__icon {
    font-size: 32px;
    color: #c0c4cc;
    margin-bottom: 8px;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    text-align: center;
  }
}

.participants-list {
  width: 100%;
  max-height: 360px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 4px;

  /* Custom scrollbar */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
    border: 2px solid #fff;
  }
  &::-webkit-scrollbar-thumb:hover { background: #c0c4cc; }
}

.participant-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.05s ease;
  position: relative;

  &__avatar {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    background: #ecf5ff;
    color: #409eff;
    border: 1px solid #d9ecff;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2d3d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__position {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  &__badge {
    flex-shrink: 0;
  }

  &__check {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid #dcdfe6;
    transition: all 0.15s ease;
    color: transparent;
    font-size: 13px;
  }

  &:hover {
    background: #f5f7fa;

    .participant-row__check {
      border-color: #c0c4cc;
    }
  }

  &:active {
    transform: scale(0.99);
  }

  &.is-selected {
    background: rgba(64, 158, 255, 0.08);

    .participant-row__name { color: #1976d2; }
    .participant-row__avatar {
      background: #409eff;
      color: #fff;
      border-color: #409eff;
    }
    .participant-row__check {
      background: #67c23a;
      border-color: #67c23a;
      color: #fff;
    }
  }

  &.is-subordinate {
    margin-left: 24px;
    background: linear-gradient(90deg, rgba(103, 194, 58, 0.05) 0%, transparent 50%);
    border-left: 3px solid #67c23a;
    padding-left: 9px;
    border-radius: 0 8px 8px 0;
  }
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
