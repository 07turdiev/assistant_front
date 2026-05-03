<template>
  <el-card class="chat-room" v-loading="loading">
    <template #header>
      <div class="header">
        <el-button @click="$router.push({ name: 'chat.list' })" link>
          ← {{ $t('common.back') }}
        </el-button>
        <span v-if="partner">{{ partnerName }}</span>
      </div>
    </template>

    <div ref="threadRef" class="thread">
      <el-empty v-if="messages.length === 0" :description="$t('chat.empty')" />
      <MessageBubble
        v-else
        v-for="m in messages"
        :key="m.id"
        :message="m"
        :is-mine="m.sender.id === auth.user?.id"
      />
    </div>

    <div class="composer">
      <el-input
        v-model="draft"
        type="textarea"
        :rows="2"
        :placeholder="$t('chat.placeholder')"
        @keydown.enter.exact.prevent="onSend"
      />
      <el-button type="primary" :loading="sending" :disabled="!draft.trim()" @click="onSend">
        {{ $t('chat.send') }}
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { chatApi } from '@/api/chat'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { fullName } from '@/utils/format'
import type { ChatMessage } from '@/types/chat'
import type { User } from '@/types/user'
import MessageBubble from '@/components/chat/MessageBubble.vue'

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const chatStore = useChatStore()

const partner = ref<User | null>(null)
const messages = ref<ChatMessage[]>([])
const loading = ref(false)
const sending = ref(false)
const draft = ref('')
const threadRef = ref<HTMLElement | null>(null)

const partnerId = computed(() => route.params.userId as string)
const partnerName = computed(() => (partner.value ? fullName(partner.value) : ''))

let stopWsHandler: (() => void) | null = null

async function loadPartner() {
  try {
    const { data } = await usersApi.fullInfo(partnerId.value)
    partner.value = data
  } catch (_e) {
    // ignore
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const { data } = await chatApi.history({ receiver_id: partnerId.value, page: 1, page_size: 100 })
    // Backend descending; UI uchun reverse (eski yuqorida)
    messages.value = [...data.results].reverse()
    await nextTick()
    scrollToBottom()
    await chatStore.fetchUnreadCount()
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  if (threadRef.value) {
    threadRef.value.scrollTop = threadRef.value.scrollHeight
  }
}

async function onSend() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  sending.value = true
  try {
    const fd = new FormData()
    fd.append('receiver_id', partnerId.value)
    fd.append('message', text)
    const { data } = await chatApi.send(fd)
    messages.value.push(data)
    draft.value = ''
    await nextTick()
    scrollToBottom()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    sending.value = false
  }
}

// WS xabarlarni real-time qabul qilish — yangi xabar kelganda history'ni qayta yuklash
function handleIncomingFromStore() {
  let lastSeen = chatStore.recentIncoming.length
  return chatStore.$subscribe(async () => {
    if (chatStore.recentIncoming.length === lastSeen) return
    const newPayloads = chatStore.recentIncoming.slice(lastSeen)
    lastSeen = chatStore.recentIncoming.length

    const relevant = newPayloads.some(
      (p) => p.from === partnerId.value
    )
    if (!relevant) return

    await loadHistory()
  })
}

onMounted(async () => {
  await Promise.all([loadPartner(), loadHistory()])
  stopWsHandler = handleIncomingFromStore()
})

onUnmounted(() => {
  if (stopWsHandler) stopWsHandler()
})

watch(() => route.params.userId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await Promise.all([loadPartner(), loadHistory()])
  }
})
</script>

<style lang="scss" scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thread {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
}

.composer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fff;

  > :first-child {
    flex: 1;
  }
}
</style>
