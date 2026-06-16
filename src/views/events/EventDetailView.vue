<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <el-tooltip :content="$t('common.back')" placement="top">
          <el-button circle @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <div class="title">
          <el-tag v-if="event?.is_important" type="danger" size="small">{{ $t('event.important') }}</el-tag>
          <span>{{ event?.title || '' }}</span>
        </div>
        <div class="actions">
          <el-tooltip v-if="canEdit" :content="$t('common.edit')" placement="top">
            <el-button type="primary" circle @click="$router.push({ name: 'events.edit', params: { id: route.params.id } })">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="canEdit" :content="$t('common.delete')" placement="top">
            <el-button type="danger" circle @click="onDelete">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <template v-if="event">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('event.date')">{{ formatDate(event.date) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('event.time')">
          {{ event.start_time?.slice(0, 5) }} – {{ event.end_time?.slice(0, 5) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.address')">{{ event.address || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('event.type')">{{ typeLabel }}</el-descriptions-item>
        <el-descriptions-item :label="$t('event.sphere')" :span="2">{{ sphereLabel }}</el-descriptions-item>
        <el-descriptions-item v-if="event.on_behalf_of" :label="$t('event.organizer')" :span="2">
          {{ formatUser(event.on_behalf_of) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.speaker')" :span="2">
          {{ formatUser(event.speaker) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="event.description" :label="$t('event.description')" :span="2">
          {{ event.description }}
        </el-descriptions-item>
        <el-descriptions-item v-if="event.serial_number" :label="$t('event.serialNumber')">
          {{ event.serial_number }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.privacy')">
          {{ event.is_private ? $t('event.private') : $t('event.public') }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="event.participant_directions && event.participant_directions.length > 0">
        <el-divider content-position="left">{{ $t('event.participantDepartments') }}</el-divider>
        <div class="users-list">
          <el-tag v-for="d in event.participant_directions" :key="d.id" type="info" class="user-tag">
            {{ locale === 'ru' ? d.name_ru : d.name_uz }}<template v-if="d.head"> — {{ formatUser(d.head) }}</template>
          </el-tag>
        </div>
      </template>

      <el-divider content-position="left">{{ $t('event.participants') }} ({{ event.participants?.length || 0 }})</el-divider>
      <div class="users-list">
        <el-tag v-for="p in event.participants" :key="p.id" class="user-tag">
          {{ formatUser(p) }}
        </el-tag>
      </div>

      <!-- Delegatsiya — boshliq o'z xodimlariga yo'naltiradi -->
      <div v-if="canForward" class="forward-block">
        <el-button type="success" plain @click="openForward">
          <el-icon><Share /></el-icon>&nbsp;{{ $t('event.forward') }}
        </el-button>
      </div>

      <template v-if="event.visitors && event.visitors.length > 0">
        <el-divider content-position="left">{{ $t('event.visitors') }} ({{ event.visitors.length }})</el-divider>
        <el-table :data="event.visitors" stripe>
          <el-table-column prop="full_name" :label="$t('event.visitorName')" />
          <el-table-column prop="position" :label="$t('event.visitorPosition')" />
          <el-table-column prop="organisation_name" :label="$t('event.visitorOrg')" />
        </el-table>
      </template>

      <template v-if="event.notify_time && event.notify_time.length > 0">
        <el-divider content-position="left">{{ $t('event.notifyTitle') }}</el-divider>
        <el-tag v-for="nt in event.notify_time" :key="nt" class="user-tag">
          {{ nt }} {{ $t('event.minutesBefore') }}
        </el-tag>
      </template>

      <template v-if="event.files && event.files.length > 0">
        <el-divider content-position="left">{{ $t('event.files') }} ({{ event.files.length }})</el-divider>
        <div class="files-list">
          <a v-for="f in event.files" :key="f.id" :href="f.url" target="_blank" class="file-link">
            <el-icon class="file-link__icon"><Paperclip /></el-icon>
            {{ f.file_name }}
            <span class="muted">({{ formatSize(f.size) }})</span>
          </a>
        </div>
      </template>

      <template v-if="event.protocols && event.protocols.length > 0">
        <el-divider content-position="left">{{ $t('event.protocols') }} ({{ event.protocols.length }})</el-divider>
        <div class="files-list">
          <a v-for="f in event.protocols" :key="f.id" :href="f.url" target="_blank" class="file-link">
            <el-icon class="file-link__icon"><Document /></el-icon>
            {{ f.file_name }}
            <span class="muted">({{ formatSize(f.size) }})</span>
          </a>
        </div>
      </template>

      <el-divider content-position="left">{{ $t('event.uploadProtocol') }}</el-divider>
      <el-upload
        :auto-upload="false"
        :file-list="protocolFiles"
        :on-change="onProtocolChange"
        :on-remove="onProtocolRemove"
        multiple
      >
        <el-button>{{ $t('event.addProtocol') }}</el-button>
      </el-upload>
      <el-button
        v-if="protocolFiles.length > 0"
        type="primary"
        :loading="uploadingProtocols"
        class="upload-btn"
        @click="onUploadProtocols"
      >
        {{ $t('event.uploadProtocolsBtn') }}
      </el-button>
    </template>
  </el-card>

  <!-- Yo'naltirish dialogi -->
  <el-dialog v-model="forwardOpen" :title="$t('event.forwardTitle')" width="460px">
    <div v-if="myTeam.length === 0" class="muted">{{ $t('event.noTeam') }}</div>
    <el-checkbox-group v-else v-model="forwardIds" class="forward-list">
      <el-checkbox v-for="u in myTeam" :key="u.id" :value="u.id">{{ formatUser(u) }}</el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="forwardOpen = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="forwarding" :disabled="forwardIds.length === 0" @click="onForward">
        {{ $t('event.forward') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { ArrowLeft, Delete, Document, Edit, Paperclip, Share } from '@element-plus/icons-vue'
import { eventsApi } from '@/api/events'
import { usersApi } from '@/api/users'
import { showApiError } from '@/utils/api-error'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookup'
import { formatDate } from '@/utils/date'
import { fullName } from '@/utils/format'
import type { Event } from '@/types/event'
import type { User } from '@/types/user'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const auth = useAuthStore()
const lookup = useLookupStore()

const event = ref<Event | null>(null)
const loading = ref(false)
const protocolFiles = ref<UploadFile[]>([])
const uploadingProtocols = ref(false)

// Delegatsiya (boshliq → quyi xodimlar)
const myTeam = ref<User[]>([])
const forwardOpen = ref(false)
const forwardIds = ref<string[]>([])
const forwarding = ref(false)

const canEdit = computed(() => {
  if (!event.value || !auth.user) return false
  return event.value.created_by_id === auth.user.id || auth.hasRole('SUPER_ADMIN')
})

// Boshliq tadbir qatnashchisi bo'lsa — o'z xodimlariga yo'naltira oladi
const canForward = computed(() => {
  if (!event.value || !auth.user || !auth.hasRole('BOSHLIQ')) return false
  return event.value.participants?.some((p) => p.id === auth.user!.id) ?? false
})

async function openForward() {
  forwardIds.value = []
  if (myTeam.value.length === 0 && auth.user) {
    try {
      const { data } = await usersApi.subordinates(auth.user.id)
      myTeam.value = data
    } catch (_e) { /* ignore */ }
  }
  forwardOpen.value = true
}

async function onForward() {
  if (!event.value || forwardIds.value.length === 0) return
  forwarding.value = true
  try {
    await eventsApi.forward(event.value.id, forwardIds.value)
    ElMessage.success(t('common.success'))
    forwardOpen.value = false
    await load()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    forwarding.value = false
  }
}

const typeLabel = computed(() => {
  if (!event.value) return ''
  return lookup.types.find((t) => t.value === event.value!.type)?.label || event.value.type
})

const sphereLabel = computed(() => {
  if (!event.value) return ''
  return lookup.spheres.find((s) => s.value === event.value!.sphere)?.label || event.value.sphere
})

function formatUser(u?: User | null): string {
  return u ? fullName(u) : '—'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

async function onDelete() {
  if (!event.value) return
  await ElMessageBox.confirm(t('event.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await eventsApi.delete(event.value.id)
    ElMessage.success(t('common.success'))
    router.push({ name: 'calendar' })
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

function onProtocolChange(file: UploadFile) {
  if (!protocolFiles.value.find((f) => f.uid === file.uid)) {
    protocolFiles.value.push(file)
  }
}

function onProtocolRemove(file: UploadFile) {
  protocolFiles.value = protocolFiles.value.filter((f) => f.uid !== file.uid)
}

async function onUploadProtocols() {
  if (!event.value || protocolFiles.value.length === 0) return
  uploadingProtocols.value = true
  try {
    const fd = new FormData()
    for (const f of protocolFiles.value) {
      if (f.raw) fd.append('files', f.raw)
    }
    await eventsApi.uploadProtocols(event.value.id, fd)
    ElMessage.success(t('common.success'))
    protocolFiles.value = []
    await load()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    uploadingProtocols.value = false
  }
}

onMounted(async () => {
  await lookup.loadAll()
  await load()
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    flex: 1;
    min-width: 0;
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
}

.users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  margin: 2px;
}

.forward-block {
  margin-top: 12px;
}

.forward-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .file-link {
    color: #409eff;
    text-decoration: none;
    padding: 6px 10px;
    background: #f5f7fa;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover {
      background: #e4e7ed;
    }

    &__icon {
      font-size: 14px;
      color: #909399;
    }

    .muted {
      color: #909399;
      font-size: 12px;
      margin-left: 4px;
    }
  }
}

.upload-btn {
  margin-top: 12px;
}
</style>
