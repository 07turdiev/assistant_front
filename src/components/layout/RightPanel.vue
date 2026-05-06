<template>
  <aside
    class="right-panel"
    :class="{
      'right-panel--mobile': isMobile,
      'right-panel--mobile-open': isMobile && mobileOpen,
    }"
  >
    <!-- Mobile header with close button -->
    <div v-if="isMobile" class="mobile-header">
      <span class="mobile-header__title">{{ activeTabLabel }}</span>
      <button class="mobile-header__close" type="button" @click="$emit('close')" aria-label="Close">
        <el-icon size="22"><Close /></el-icon>
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
        <el-badge
          v-if="tab.count > 0"
          :value="tab.count"
          :max="99"
          class="tab__badge"
        />
      </button>
    </div>

    <!-- ===== CHAT TAB ===== -->
    <template v-if="activeTab === 'chat'">
      <div v-if="!selectedPartnerId" class="panel-body">
        <div v-if="chatPartners.length === 0" class="empty">
          {{ $t('rightPanel.noPartners') }}
        </div>
        <div
          v-for="u in chatPartners"
          :key="u.id"
          class="row"
          @click="openChatThread(u)"
        >
          <el-avatar :size="36" :src="u.avatar_url || undefined">
            {{ initialsFor(u) }}
          </el-avatar>
          <div class="row__content">
            <div class="row__name">{{ formatUser(u) }}</div>
            <div v-if="u.position_uz" class="row__preview">{{ u.position_uz }}</div>
          </div>
          <el-badge
            v-if="chat.unreadBySender[u.id] > 0"
            :value="chat.unreadBySender[u.id]"
            :max="99"
          />
        </div>
      </div>

      <template v-else>
        <div class="thread-header">
          <el-button link @click="closeChatThread">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-avatar :size="32" :src="selectedPartner?.avatar_url || undefined">
            {{ selectedPartner ? initialsFor(selectedPartner) : '' }}
          </el-avatar>
          <span class="thread-header__name">{{ formatUser(selectedPartner) }}</span>
        </div>
        <div ref="threadRef" class="thread-body" v-loading="threadLoading">
          <div v-if="threadMessages.length === 0" class="empty">
            {{ $t('chat.empty') }}
          </div>
          <div
            v-else
            v-for="m in threadMessages"
            :key="m.id"
            class="bubble"
            :class="{ 'bubble--mine': m.sender.id === auth.user?.id }"
          >
            <div class="bubble__text">{{ m.message }}</div>
            <div class="bubble__time">{{ formatTime(m.created_at) }}</div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="draft"
            :placeholder="$t('chat.placeholder')"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 3 }"
            @keydown.enter.exact.prevent="onSendMessage"
          />
          <el-button type="primary" :loading="sending" :disabled="!draft.trim()" @click="onSendMessage">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
      </template>
    </template>

    <!-- ===== TASKS TAB ===== -->
    <template v-else-if="activeTab === 'task'">
      <div v-if="!selectedReportId" class="panel-body">
        <div v-if="canCreateTask" class="create-block">
          <el-button type="primary" size="small" class="create-btn" @click="taskCreateOpen = true">
            + {{ $t('rightPanel.newTask') }}
          </el-button>
        </div>
        <el-tabs v-model="taskScope" class="report-scope-tabs">
          <el-tab-pane :label="$t('rightPanel.activeScope')" name="active" />
          <el-tab-pane :label="$t('rightPanel.historyScope')" name="history" />
        </el-tabs>
        <div v-if="visibleTasks.length === 0" class="empty">
          {{ $t('rightPanel.noTasks') }}
        </div>
        <div
          v-for="r in visibleTasks"
          :key="r.id"
          class="row"
          @click="openReportDetail(r)"
        >
          <el-avatar :size="36" :src="r.sender?.avatar_url || undefined">
            {{ initialsFor(r.sender) }}
          </el-avatar>
          <div class="row__content">
            <div class="row__name">{{ formatUser(r.sender) }}</div>
            <div class="row__preview">{{ truncate(r.description) }}</div>
          </div>
          <el-tag v-if="r.reply" :color="replyColor(r.reply)" size="small"
                  :style="{ color:'#fff', backgroundColor: replyColor(r.reply), border:'none' }">
            {{ replyLabel(r.reply, 'task') }}
          </el-tag>
        </div>
      </div>

      <ReportDetailPanel
        v-else
        :report="selectedReport"
        kind="task"
        @back="closeReportDetail"
        @replied="onReportReplied"
      />
    </template>

    <!-- ===== REQUESTS TAB ===== -->
    <template v-else>
      <div v-if="!selectedReportId" class="panel-body">
        <div v-if="canCreateRequest" class="create-block">
          <el-button type="primary" size="small" class="create-btn" @click="taskCreateOpen = true">
            + {{ $t('rightPanel.newRequest') }}
          </el-button>
        </div>
        <el-tabs v-model="requestScope" class="report-scope-tabs">
          <el-tab-pane :label="$t('rightPanel.activeScope')" name="active" />
          <el-tab-pane :label="$t('rightPanel.historyScope')" name="history" />
        </el-tabs>
        <div v-if="visibleRequests.length === 0" class="empty">
          {{ $t('rightPanel.noRequests') }}
        </div>
        <div
          v-for="r in visibleRequests"
          :key="r.id"
          class="row"
          @click="openReportDetail(r)"
        >
          <el-avatar :size="36" :src="r.sender?.avatar_url || undefined">
            {{ initialsFor(r.sender) }}
          </el-avatar>
          <div class="row__content">
            <div class="row__name">{{ formatUser(r.sender) }}</div>
            <div class="row__preview">{{ truncate(r.description) }}</div>
          </div>
          <el-tag v-if="r.reply" :color="replyColor(r.reply)" size="small"
                  :style="{ color:'#fff', backgroundColor: replyColor(r.reply), border:'none' }">
            {{ replyLabel(r.reply, 'request') }}
          </el-tag>
        </div>
      </div>

      <ReportDetailPanel
        v-else
        :report="selectedReport"
        kind="request"
        @back="closeReportDetail"
        @replied="onReportReplied"
      />
    </template>

    <!-- Yangi topshiriq/sorov dialogi -->
    <el-dialog v-model="taskCreateOpen" :title="createDialogTitle" width="480px">
      <el-form :model="createForm" label-position="top">
        <el-form-item :label="$t('reports.description')" required>
          <el-input v-model="createForm.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskCreateOpen = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="onCreateReport">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Close, Promotion } from '@element-plus/icons-vue'
import { usersApi } from '@/api/users'
import { chatApi } from '@/api/chat'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useLookupStore } from '@/stores/lookup'
import { fullName } from '@/utils/format'
import { formatTime } from '@/utils/date'
import { showApiError } from '@/utils/api-error'
import type { User } from '@/types/user'
import type { Report } from '@/types/report'
import type { ChatMessage } from '@/types/chat'
import ReportDetailPanel from './ReportDetailPanel.vue'

type TabKey = 'chat' | 'task' | 'request'

withDefaults(
  defineProps<{
    isMobile?: boolean
    mobileOpen?: boolean
  }>(),
  { isMobile: false, mobileOpen: false },
)

const emit = defineEmits<{
  close: []
  'badge-count': [value: number]
}>()

const { t } = useI18n()
const auth = useAuthStore()
const chat = useChatStore()
const lookup = useLookupStore()

const activeTab = ref<TabKey>('chat')

// Chat
const chatPartners = ref<User[]>([])
const selectedPartnerId = ref<string | null>(null)
const selectedPartner = computed(() => chatPartners.value.find((u) => u.id === selectedPartnerId.value) || null)
const threadMessages = ref<ChatMessage[]>([])
const threadLoading = ref(false)
const draft = ref('')
const sending = ref(false)
const threadRef = ref<HTMLElement | null>(null)

// Tasks / Requests
const tasksAll = ref<Report[]>([])
const requestsAll = ref<Report[]>([])
const taskScope = ref<'active' | 'history'>('active')
const requestScope = ref<'active' | 'history'>('active')
const selectedReportId = ref<string | null>(null)
const selectedReport = computed<Report | null>(() => {
  const all = [...tasksAll.value, ...requestsAll.value]
  return all.find((r) => r.id === selectedReportId.value) || null
})

const visibleTasks = computed(() => {
  if (taskScope.value === 'active') return tasksAll.value.filter((r) => !r.reply)
  return tasksAll.value.filter((r) => r.reply)
})
const visibleRequests = computed(() => {
  if (requestScope.value === 'active') return requestsAll.value.filter((r) => !r.reply)
  return requestsAll.value.filter((r) => r.reply)
})

// Create dialog
const canCreateTask = computed(() => auth.hasRole('PREMIER_MINISTER', 'HEAD'))
const canCreateRequest = computed(() => auth.hasRole('ASSISTANT', 'ASSISTANT_PREMIER'))
const taskCreateOpen = ref(false)
const creating = ref(false)
const createForm = reactive({ description: '' })
const createDialogTitle = computed(() => {
  if (activeTab.value === 'task') return t('reports.taskTitle')
  return t('reports.requestTitle')
})

const tabs = computed(() => [
  { key: 'chat' as TabKey, label: t('rightPanel.chat'), count: chat.unreadCount },
  {
    key: 'task' as TabKey,
    label: t('rightPanel.task'),
    count: tasksAll.value.filter((r) => !r.reply).length,
  },
  {
    key: 'request' as TabKey,
    label: t('rightPanel.request'),
    count: requestsAll.value.filter((r) => !r.reply).length,
  },
])

const activeTabLabel = computed(
  () => tabs.value.find((tb) => tb.key === activeTab.value)?.label || '',
)

const totalBadge = computed(() => tabs.value.reduce((sum, tb) => sum + tb.count, 0))

watch(totalBadge, (val) => emit('badge-count', val), { immediate: true })

function formatUser(u: User | null | undefined): string {
  return u ? fullName(u) : '—'
}

function initialsFor(u: User | null | undefined): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

function truncate(text: string, max = 50): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

function replyLabel(value: string, kind: 'task' | 'request'): string {
  const list = kind === 'task' ? lookup.taskReplies : lookup.requestReplies
  return list.find((c) => c.value === value)?.label || value
}

function replyColor(value: string): string {
  const list = [...lookup.taskReplies, ...lookup.requestReplies]
  return list.find((c) => c.value === value)?.color || '#909399'
}

function setActiveChatInSW(partnerId: string | null) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: 'set-active-chat', partnerId })
  }).catch(() => { /* SW hali tayyor emas */ })
}

function onTabChange(key: TabKey) {
  activeTab.value = key
  selectedPartnerId.value = null
  selectedReportId.value = null
  setActiveChatInSW(null)
}

// Chat
async function loadChatPartners() {
  try {
    const { data } = await usersApi.chatters()
    chatPartners.value = [...data].sort((a, b) => {
      const ua = chat.unreadBySender[a.id] || 0
      const ub = chat.unreadBySender[b.id] || 0
      return ub - ua
    })
  } catch (_e) { /* ignore */ }
}

async function openChatThread(u: User) {
  selectedPartnerId.value = u.id
  setActiveChatInSW(u.id)
  threadLoading.value = true
  try {
    const { data } = await chatApi.history({ receiver_id: u.id, page: 1, page_size: 100 })
    threadMessages.value = [...data.results].reverse()
    await nextTick()
    if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
    await chat.fetchUnreadCount()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    threadLoading.value = false
  }
}

function closeChatThread() {
  selectedPartnerId.value = null
  threadMessages.value = []
  draft.value = ''
  setActiveChatInSW(null)
}

async function onSendMessage() {
  const text = draft.value.trim()
  if (!text || !selectedPartnerId.value || sending.value) return
  sending.value = true
  try {
    const fd = new FormData()
    fd.append('receiver_id', selectedPartnerId.value)
    fd.append('message', text)
    const { data } = await chatApi.send(fd)
    threadMessages.value.push(data)
    draft.value = ''
    await nextTick()
    if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    sending.value = false
  }
}

// Reports
async function loadTasks() {
  try {
    const [a, h] = await Promise.all([
      reportsApi.tasksActive(),
      reportsApi.tasksInactive({ page: 1, page_size: 100 }),
    ])
    tasksAll.value = [...a.data, ...h.data.results]
  } catch (_e) { /* ignore */ }
}

async function loadRequests() {
  try {
    const [a, h] = await Promise.all([
      reportsApi.requestsActive(),
      reportsApi.requestsInactive({ page: 1, page_size: 100 }),
    ])
    requestsAll.value = [...a.data, ...h.data.results]
  } catch (_e) { /* ignore */ }
}

function openReportDetail(r: Report) {
  selectedReportId.value = r.id
}

function closeReportDetail() {
  selectedReportId.value = null
}

async function onReportReplied() {
  if (activeTab.value === 'task') await loadTasks()
  else if (activeTab.value === 'request') await loadRequests()
}

async function onCreateReport() {
  const desc = createForm.description.trim()
  if (!desc) return
  creating.value = true
  try {
    await reportsApi.create({ description: desc })
    ElMessage.success(t('common.success'))
    createForm.description = ''
    taskCreateOpen.value = false
    if (activeTab.value === 'task') await loadTasks()
    else await loadRequests()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    creating.value = false
  }
}

async function refreshAll() {
  if (!auth.isAuthenticated) return
  await Promise.all([
    lookup.loadAll(),
    loadChatPartners(),
    loadTasks(),
    loadRequests(),
    chat.fetchUnreadCount(),
  ])
}

watch(() => auth.isAuthenticated, async (val) => {
  if (val) await refreshAll()
})

watch(() => chat.recentIncoming.length, async () => {
  if (!auth.isAuthenticated) return
  await chat.fetchUnreadCount()
  if (selectedPartnerId.value) {
    const partnerId = selectedPartnerId.value
    const { data } = await chatApi.history({ receiver_id: partnerId, page: 1, page_size: 100 })
    threadMessages.value = [...data.results].reverse()
    await nextTick()
    if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
  } else {
    await loadChatPartners()
  }
})

// Push bildirishnoma click → ?openChat=<id> bilan kelganda chat thread'ni avtomatik ochish
const route = useRoute()
const router = useRouter()

async function openChatBySenderId(senderId: string) {
  if (!senderId || !auth.isAuthenticated) return
  activeTab.value = 'chat'
  // chatPartners hali yuklanmagan bo'lishi mumkin
  if (chatPartners.value.length === 0) await loadChatPartners()
  let partner = chatPartners.value.find((u) => u.id === senderId)
  if (!partner) {
    try {
      const { data } = await usersApi.fullInfo(senderId)
      partner = data
    } catch (_e) { /* ignore */ }
  }
  if (partner) await openChatThread(partner)
}

watch(
  () => route.query.openChat,
  async (val) => {
    if (!val) return
    const senderId = String(val)
    await openChatBySenderId(senderId)
    // URL'dan parametrni tozalaymiz (history'da iflos bo'lmasin)
    const { openChat: _drop, ...rest } = route.query
    router.replace({ query: rest })
  },
  { immediate: true },
)

// Service worker'dan "push-skipped" signali — focus'da turganda audio/visual reaksiya joyi
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data?.type !== 'push-skipped') return
    const payload = event.data.payload || {}
    if (payload.data?.channel === 'chat') {
      await chat.fetchUnreadCount()
      await loadChatPartners()
    }
  })
}

onMounted(refreshAll)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.right-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* ============================================================
     Mobile drawer mode — fixed slide-in from right
     ============================================================ */
  &--mobile {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    height: 100dvh;
    width: min(92vw, 360px);
    z-index: 100;
    transform: translateX(100%);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
    border-left: none;
  }

  &--mobile-open {
    transform: translateX(0);
  }
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2d3d;
  }

  &__close {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    color: #5a6c7d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;

    &:hover { background: #f1f3f4; }
    &:active { background: #e8eaed; }
  }
}

.tabs {
  display: flex;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.tab {
  flex: 1;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 18px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  position: relative;
  color: #5a6c7d;
  transition: all 0.15s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }

  &--active {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
  }

  &__badge {
    margin-left: 4px;
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 24px 16px;
}

.create-block {
  padding: 8px 12px;
  border-bottom: 1px solid #f5f7fa;

  .create-btn {
    width: 100%;
  }
}

.report-scope-tabs {
  padding: 0 12px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.el-tabs__item) {
    height: 36px;
    line-height: 36px;
    font-size: 13px;
    padding: 0 12px;
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f5f7fa;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2d3d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__preview {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.thread-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;

  &__name {
    font-weight: 500;
    font-size: 14px;
  }
}

.thread-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.bubble {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  max-width: 80%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  word-break: break-word;

  &--mine {
    align-self: flex-end;
    background: #d4e9ff;
  }

  &__text {
    white-space: pre-wrap;
  }

  &__time {
    text-align: right;
    font-size: 10px;
    color: #909399;
    margin-top: 4px;
  }
}

.chat-input {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;

  > .el-textarea {
    flex: 1;
  }
}

/* ============================================================
   Mobile tuning
   ============================================================ */
@include mobile {
  .right-panel:not(.right-panel--mobile) {
    display: none;
  }

  .tabs {
    padding: 10px;
    gap: 4px;
  }

  .tab {
    font-size: 12px;
    padding: 6px 8px;
  }

  .row {
    padding: 12px 14px;
  }

  .bubble {
    max-width: 88%;
  }
}
</style>
