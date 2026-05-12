<template>
  <div class="admin-chats">
    <el-card class="filters">
      <template #header>
        <div class="filters__header">
          <h2 class="filters__title">
            <el-icon class="filters__icon"><ChatLineRound /></el-icon>
            Yozishmalarni boshqarish
          </h2>
          <span class="filters__hint">
            Suhbatni ko'rish uchun ikki foydalanuvchini tanlang
          </span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <div class="filter-block">
            <label class="filter-label">1-foydalanuvchi</label>
            <el-select
              v-model="userA"
              filterable
              remote
              :remote-method="searchUsersA"
              :loading="userASearchLoading"
              placeholder="Ism, familiya, login bilan qidiring"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="u in userAOptions"
                :key="u.id"
                :label="`${u.last_name} ${u.first_name} (${u.username})`"
                :value="u.id"
              />
            </el-select>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="filter-block">
            <label class="filter-label">2-foydalanuvchi</label>
            <el-select
              v-model="userB"
              filterable
              remote
              :remote-method="searchUsersB"
              :loading="userBSearchLoading"
              placeholder="Ism, familiya, login bilan qidiring"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="u in userBOptions"
                :key="u.id"
                :label="`${u.last_name} ${u.first_name} (${u.username})`"
                :value="u.id"
              />
            </el-select>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Recent threads (when no users selected) -->
    <el-card v-if="!bothSelected" v-loading="threadsLoading" class="threads">
      <template #header>
        <div class="threads__header">
          <h3 class="threads__title">So'nggi suhbatlar</h3>
          <el-input
            v-model="threadsSearch"
            placeholder="Foydalanuvchi nomi bilan filtr"
            clearable
            style="width: 280px"
            @input="onThreadsSearchInput"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>
      <div v-if="threads.length === 0 && !threadsLoading" class="empty">
        Hech qanday suhbat topilmadi
      </div>
      <div
        v-for="t in threads"
        :key="`${t.user_a.id}-${t.user_b.id}`"
        class="thread-row"
        @click="onPickThread(t)"
      >
        <div class="thread-row__pair">
          <span class="thread-row__name">{{ formatUser(t.user_a) }}</span>
          <el-icon><Right /></el-icon>
          <span class="thread-row__name">{{ formatUser(t.user_b) }}</span>
        </div>
        <div class="thread-row__meta">
          <el-tag size="small" type="info">{{ t.total }} habar</el-tag>
          <span class="thread-row__time">{{ formatRelative(t.last_message_at) }}</span>
        </div>
      </div>
    </el-card>

    <!-- Conversation view (when both users selected) -->
    <el-card v-else v-loading="conversationLoading" class="conversation">
      <template #header>
        <div class="conv-header">
          <el-button :icon="ArrowLeft" @click="clearSelection">Orqaga</el-button>
          <div class="conv-header__pair">
            <span class="conv-header__name">{{ formatUser(userAObj) }}</span>
            <el-icon><Right /></el-icon>
            <span class="conv-header__name">{{ formatUser(userBObj) }}</span>
          </div>
        </div>
      </template>

      <div v-if="messages.length === 0 && !conversationLoading" class="empty">
        Bu ikki foydalanuvchi orasida hech qanday habar yo'q
      </div>

      <div ref="threadBodyRef" class="thread-body">
        <div
          v-for="m in messages"
          :key="m.id"
          class="bubble"
          :class="{
            'bubble--a': m.sender.id === userA,
            'bubble--b': m.sender.id === userB,
            'bubble--deleted': m.is_deleted,
          }"
        >
          <div class="bubble__head">
            <span class="bubble__sender">{{ formatUser(m.sender) }}</span>
            <span class="bubble__time">{{ formatTime(m.created_at) }}</span>
            <el-button
              v-if="!m.is_deleted"
              link
              type="danger"
              size="small"
              class="bubble__delete"
              @click="onDelete(m)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div class="bubble__text">{{ m.message }}</div>
          <div v-if="m.is_deleted" class="bubble__deleted-tag">
            <el-icon><Delete /></el-icon>
            O'chirilgan{{ m.deleted_by ? ` — ${formatUser(m.deleted_by)}` : '' }}
            <span v-if="m.deleted_at" class="bubble__deleted-time">
              · {{ formatTime(m.deleted_at) }}
            </span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ChatLineRound,
  Delete,
  Right,
  Search,
} from '@element-plus/icons-vue'
import { chatApi } from '@/api/chat'
import { usersApi } from '@/api/users'
import { showApiError } from '@/utils/api-error'
import { formatTime } from '@/utils/date'
import type { ChatMessage, ChatThreadSummary } from '@/types/chat'
import type { User } from '@/types/user'

const userA = ref<string | null>(null)
const userB = ref<string | null>(null)
const userAOptions = ref<User[]>([])
const userBOptions = ref<User[]>([])
const userASearchLoading = ref(false)
const userBSearchLoading = ref(false)

const threads = ref<ChatThreadSummary[]>([])
const threadsLoading = ref(false)
const threadsSearch = ref('')

const messages = ref<ChatMessage[]>([])
const conversationLoading = ref(false)
const threadBodyRef = ref<HTMLElement | null>(null)

const bothSelected = computed(() => Boolean(userA.value && userB.value))

const userAObj = computed(
  () => userAOptions.value.find((u) => u.id === userA.value)
    || threads.value.flatMap((t) => [t.user_a, t.user_b]).find((u) => u.id === userA.value)
    || null,
)
const userBObj = computed(
  () => userBOptions.value.find((u) => u.id === userB.value)
    || threads.value.flatMap((t) => [t.user_a, t.user_b]).find((u) => u.id === userB.value)
    || null,
)

function formatUser(u: User | null | undefined): string {
  if (!u) return '—'
  return `${u.last_name} ${u.first_name}`
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'hozir'
  if (minutes < 60) return `${minutes} daqiqa oldin`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} kun oldin`
  return d.toLocaleDateString()
}

async function searchUsersA(query: string) {
  if (!query) return
  userASearchLoading.value = true
  try {
    const { data } = await usersApi.participants({ search: query })
    userAOptions.value = data
  } finally {
    userASearchLoading.value = false
  }
}

async function searchUsersB(query: string) {
  if (!query) return
  userBSearchLoading.value = true
  try {
    const { data } = await usersApi.participants({ search: query })
    userBOptions.value = data
  } finally {
    userBSearchLoading.value = false
  }
}

let threadsSearchTimer: ReturnType<typeof setTimeout> | null = null
function onThreadsSearchInput() {
  if (threadsSearchTimer) clearTimeout(threadsSearchTimer)
  threadsSearchTimer = setTimeout(() => loadThreads(), 300)
}

async function loadThreads() {
  threadsLoading.value = true
  try {
    const { data } = await chatApi.adminThreads({ search: threadsSearch.value.trim() })
    threads.value = data
  } catch (e: unknown) {
    showApiError(e, 'Suhbatlarni yuklashda xato')
  } finally {
    threadsLoading.value = false
  }
}

function onPickThread(t: ChatThreadSummary) {
  // Tanlangan paire'ni user select'larga ham qo'shamiz (label ko'rinishi uchun)
  if (!userAOptions.value.find((u) => u.id === t.user_a.id)) userAOptions.value.push(t.user_a)
  if (!userBOptions.value.find((u) => u.id === t.user_b.id)) userBOptions.value.push(t.user_b)
  userA.value = t.user_a.id
  userB.value = t.user_b.id
}

function clearSelection() {
  userA.value = null
  userB.value = null
  messages.value = []
}

async function loadConversation() {
  if (!bothSelected.value || !userA.value || !userB.value) return
  if (userA.value === userB.value) {
    ElMessage.warning('Ikki xil foydalanuvchi tanlang')
    return
  }
  conversationLoading.value = true
  try {
    const { data } = await chatApi.adminConversation({
      user_a: userA.value,
      user_b: userB.value,
      page: 1,
      page_size: 200,
    })
    // API DRF page format yoki array qaytaradi
    const list = Array.isArray(data) ? data : data.results
    // Eski → yangi tartibda
    messages.value = [...list].reverse()
    await nextTick()
    if (threadBodyRef.value) {
      threadBodyRef.value.scrollTop = threadBodyRef.value.scrollHeight
    }
  } catch (e: unknown) {
    showApiError(e, 'Suhbatni yuklashda xato')
  } finally {
    conversationLoading.value = false
  }
}

async function onDelete(m: ChatMessage) {
  try {
    await ElMessageBox.confirm(
      `"${m.message.slice(0, 80)}" habarini o'chirish? Audit izi qoladi.`,
      'Habarni o\'chirish',
      { type: 'warning', confirmButtonText: 'O\'chirish', cancelButtonText: 'Bekor' },
    )
  } catch { return }

  try {
    const { data } = await chatApi.delete(m.id)
    // Mahalliy ro'yxatdagi habarni soft-delete holatiga o'tkazamiz
    const idx = messages.value.findIndex((x) => x.id === m.id)
    if (idx >= 0) messages.value[idx] = data
    ElMessage.success('Habar o\'chirildi')
  } catch (e: unknown) {
    showApiError(e, 'Habarni o\'chirishda xato')
  }
}

watch([userA, userB], () => {
  if (bothSelected.value) loadConversation()
})

onMounted(loadThreads)
</script>

<style lang="scss" scoped>
.admin-chats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters {
  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  &__icon {
    color: var(--el-color-primary);
  }
  &__hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.filter-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.threads__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.threads__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.thread-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover { background: var(--el-fill-color-light); }
  &:last-child { border-bottom: none; }

  &__pair {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.conv-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  &__pair {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    flex: 1;
    min-width: 0;
  }
}

.thread-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.bubble {
  padding: 8px 12px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  max-width: 75%;
  word-break: break-word;

  &--a {
    align-self: flex-start;
    border-top-left-radius: 4px;
  }
  &--b {
    align-self: flex-end;
    background: #d4e9ff;
    border-top-right-radius: 4px;
  }
  &--deleted {
    opacity: 0.55;
    .bubble__text {
      text-decoration: line-through;
      color: var(--el-text-color-secondary);
    }
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__sender {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__time {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    margin-left: auto;
  }

  &__delete {
    padding: 0;
    height: auto;
  }

  &__text {
    font-size: 13px;
    white-space: pre-wrap;
  }

  &__deleted-tag {
    margin-top: 6px;
    font-size: 11px;
    color: var(--el-color-danger);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__deleted-time {
    color: var(--el-text-color-secondary);
  }
}

.empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  padding: 24px;
}

@media (max-width: 768px) {
  .bubble { max-width: 90%; }
  .thread-body { max-height: 70vh; }
}
</style>
