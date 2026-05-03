<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
    <el-row :gutter="16">
      <el-col :span="24">
        <el-form-item :label="$t('event.title')" prop="title" required>
          <el-input v-model="form.title" :placeholder="$t('event.titleHint')" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="$t('event.date')" prop="date" required>
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="$t('event.date')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.startTime')" prop="start_time" required>
          <el-time-picker
            v-model="form.start_time"
            value-format="HH:mm"
            format="HH:mm"
            :placeholder="$t('event.startTime')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.endTime')" prop="end_time" required>
          <el-time-picker
            v-model="form.end_time"
            value-format="HH:mm"
            format="HH:mm"
            :placeholder="$t('event.endTime')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="$t('event.sphere')" prop="sphere" required>
          <el-select v-model="form.sphere" filterable :placeholder="$t('event.sphere')" style="width: 100%">
            <el-option v-for="s in lookup.spheres" :key="s.value" :value="s.value" :label="s.label" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('event.type')" prop="type" required>
          <el-select v-model="form.type" :placeholder="$t('event.type')" style="width: 100%">
            <el-option v-for="t in lookup.types" :key="t.value" :value="t.value" :label="t.label" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-form-item :label="$t('event.address')">
          <el-input v-model="form.address" :placeholder="$t('event.addressHint')" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-form-item :label="$t('event.description')">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="$t('event.speaker')" prop="speaker_id" required>
          <el-select
            v-model="form.speaker_id"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            :placeholder="$t('event.searchUser')"
            style="width: 100%"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :value="u.id"
              :label="formatUser(u)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('event.direction')" prop="direction_id">
          <el-select v-model="form.direction_id" filterable style="width: 100%">
            <el-option
              v-for="d in directions"
              :key="d.id"
              :value="d.id"
              :label="locale === 'ru' ? d.name_ru : d.name_uz"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-form-item :label="$t('event.participants')" prop="participant_ids" required>
          <el-select
            v-model="form.participant_ids"
            multiple
            filterable
            remote
            :remote-method="searchParticipants"
            :loading="participantSearchLoading"
            :placeholder="$t('event.participantsHint')"
            style="width: 100%"
          >
            <el-option
              v-for="u in participantOptions"
              :key="u.id"
              :value="u.id"
              :label="formatUser(u)"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item>
          <el-checkbox v-model="form.is_important">{{ $t('event.isImportant') }}</el-checkbox>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item>
          <el-checkbox v-model="form.is_private">{{ $t('event.isPrivate') }}</el-checkbox>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Notify time list -->
    <el-divider content-position="left">{{ $t('event.notifyTitle') }}</el-divider>
    <el-form-item>
      <div class="notify-list">
        <el-tag
          v-for="(nt, i) in form.notify_time_list"
          :key="i"
          closable
          @close="removeNotifyTime(i)"
        >
          {{ nt }} {{ $t('event.minutesBefore') }}
        </el-tag>
        <el-input
          v-model.number="newNotifyTime"
          type="number"
          :min="1"
          :max="10080"
          size="small"
          style="width: 120px"
          :placeholder="$t('event.minutes')"
          @keydown.enter.prevent="addNotifyTime"
        />
        <el-button size="small" @click="addNotifyTime">{{ $t('common.add') }}</el-button>
      </div>
    </el-form-item>

    <!-- Visitors -->
    <el-divider content-position="left">{{ $t('event.visitors') }}</el-divider>
    <div v-for="(v, i) in form.visitors" :key="i" class="visitor-row">
      <el-input v-model="v.full_name" :placeholder="$t('event.visitorName')" style="flex: 1" />
      <el-input v-model="v.position" :placeholder="$t('event.visitorPosition')" style="flex: 1" />
      <el-input v-model="v.organisation_name" :placeholder="$t('event.visitorOrg')" style="flex: 1" />
      <el-button type="danger" size="small" @click="removeVisitor(i)">×</el-button>
    </div>
    <el-button size="small" @click="addVisitor">+ {{ $t('event.addVisitor') }}</el-button>

    <!-- Files -->
    <el-divider content-position="left">{{ $t('event.files') }}</el-divider>
    <el-upload
      :auto-upload="false"
      :file-list="newFiles"
      :on-change="onFileChange"
      :on-remove="onFileRemove"
      multiple
    >
      <el-button>{{ $t('event.addFile') }}</el-button>
      <template #tip>
        <p class="muted">{{ $t('event.filesHint') }}</p>
      </template>
    </el-upload>

    <!-- Existing files (edit mode) -->
    <div v-if="existingFiles.length > 0" class="existing-files">
      <p class="muted">{{ $t('event.existingFiles') }}</p>
      <div v-for="f in existingFiles" :key="f.id" class="existing-file">
        <a :href="f.url" target="_blank">📎 {{ f.file_name }}</a>
        <el-button size="small" type="danger" link @click="markFileForDeletion(f.id)">×</el-button>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" native-type="submit" :loading="submitting">
        {{ $t('common.save') }}
      </el-button>
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useLookupStore } from '@/stores/lookup'
import { usersApi } from '@/api/users'
import { adminDirectionsApi, type Direction } from '@/api/admin'
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

const formRef = ref<FormInstance>()

const form = reactive<FormShape>({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  address: '',
  description: '',
  sphere: '',
  type: '',
  is_important: false,
  is_private: false,
  speaker_id: '',
  direction_id: '',
  participant_ids: [],
  notify_time_list: [],
  visitors: [],
})

const userOptions = ref<User[]>([])
const participantOptions = ref<User[]>([])
const directions = ref<Direction[]>([])
const userSearchLoading = ref(false)
const participantSearchLoading = ref(false)

const newNotifyTime = ref<number | undefined>(undefined)
const newFiles = ref<UploadFile[]>([])
const existingFiles = ref<Attachment[]>([])
const deletedFileIds = ref<string[]>([])

const rules: FormRules = {
  title: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  date: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  start_time: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  end_time: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  sphere: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  speaker_id: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  participant_ids: [{
    required: true,
    validator: (_r, val, cb) => {
      if (!val || val.length === 0) cb(new Error(t('common.required')))
      else cb()
    },
    trigger: 'change',
  }],
}

function formatUser(u: User): string {
  return fullName(u)
}

let userSearchTimer: number | null = null
async function searchUsers(query: string) {
  if (userSearchTimer) clearTimeout(userSearchTimer)
  userSearchTimer = window.setTimeout(async () => {
    userSearchLoading.value = true
    try {
      const { data } = await usersApi.list({ search: query, page_size: 50 })
      userOptions.value = data.results
    } finally {
      userSearchLoading.value = false
    }
  }, 300)
}

let pSearchTimer: number | null = null
async function searchParticipants(query: string) {
  if (pSearchTimer) clearTimeout(pSearchTimer)
  pSearchTimer = window.setTimeout(async () => {
    participantSearchLoading.value = true
    try {
      const { data } = await usersApi.list({ search: query, page_size: 50 })
      participantOptions.value = data.results
    } finally {
      participantSearchLoading.value = false
    }
  }, 300)
}

async function loadDirections() {
  try {
    const { data } = await adminDirectionsApi.list()
    directions.value = data
  } catch (_e) {
    directions.value = []
  }
}

function addNotifyTime() {
  const v = newNotifyTime.value
  if (typeof v !== 'number' || v < 1) return
  if (!form.notify_time_list.includes(v)) {
    form.notify_time_list.push(v)
    form.notify_time_list.sort((a, b) => a - b)
  }
  newNotifyTime.value = undefined
}

function removeNotifyTime(i: number) {
  form.notify_time_list.splice(i, 1)
}

function addVisitor() {
  form.visitors.push({ full_name: '', organisation_name: '', position: '' })
}

function removeVisitor(i: number) {
  form.visitors.splice(i, 1)
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
    form.sphere = e.sphere
    form.type = e.type
    form.is_important = e.is_important
    form.is_private = e.is_private
    form.speaker_id = e.speaker?.id || ''
    form.participant_ids = e.participants?.map((p) => p.id) || []
    form.notify_time_list = [...(e.notify_time || [])]
    form.visitors = (e.visitors || []).map((v) => ({ ...v }))
    existingFiles.value = e.files || []

    // Speaker va participants'larni options'ga qo'shamiz (display uchun)
    if (e.speaker && !userOptions.value.find((u) => u.id === e.speaker.id)) {
      userOptions.value.push(e.speaker)
    }
    for (const p of e.participants || []) {
      if (!participantOptions.value.find((u) => u.id === p.id)) {
        participantOptions.value.push(p)
      }
    }
  },
  { immediate: true }
)

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  emit('submit', {
    dto: { ...form },
    files: newFiles.value.map((f) => f.raw as File).filter(Boolean),
    deletedFileIds: [...deletedFileIds.value],
  })
}

onMounted(async () => {
  await Promise.all([
    lookup.loadAll(),
    loadDirections(),
    searchParticipants(''),
  ])
  // userOptions ham initial holat bilan to'liladi
  if (participantOptions.value.length > 0) {
    userOptions.value = [...participantOptions.value]
  }
})
</script>

<style lang="scss" scoped>
.notify-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.visitor-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.muted {
  color: #909399;
  font-size: 13px;
  margin: 4px 0;
}

.existing-files {
  margin-top: 12px;

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

.actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}
</style>
