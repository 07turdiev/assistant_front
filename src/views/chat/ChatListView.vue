<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('nav.chat') }}</span>
        <el-input
          v-model="search"
          :placeholder="$t('common.search')"
          clearable
          style="width: 280px"
          @input="onSearch"
        />
      </div>
    </template>

    <el-empty v-if="filteredUsers.length === 0" :description="$t('chat.noChatters')" />

    <el-table v-else :data="filteredUsers" stripe @row-click="onSelectUser">
      <el-table-column :label="$t('chat.partner')">
        <template #default="{ row }">
          <div class="partner">
            <el-avatar :size="36" :src="row.avatar_url || undefined">
              {{ initials(row) }}
            </el-avatar>
            <div class="partner__info">
              <div class="partner__name">{{ formatUser(row) }}</div>
              <div class="partner__pos">{{ position(row) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('chat.unread')" width="120" align="right">
        <template #default="{ row }">
          <el-badge
            v-if="unreadFor(row.id) > 0"
            :value="unreadFor(row.id)"
            type="primary"
          />
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column width="80" align="right">
        <template #default>
          <el-icon class="muted"><ArrowRight /></el-icon>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { usersApi } from '@/api/users'
import { chatApi } from '@/api/chat'
import { fullName } from '@/utils/format'
import type { User } from '@/types/user'

const router = useRouter()
const { locale } = useI18n()

const users = ref<User[]>([])
const unreadBySender = ref<Record<string, number>>({})
const loading = ref(false)
const search = ref('')

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) => {
    const name = fullName(u).toLowerCase()
    return name.includes(q) || u.username.toLowerCase().includes(q)
  })
})

function formatUser(u: User): string {
  return fullName(u)
}

function position(u: User): string {
  return locale.value === 'ru' ? u.position_ru || '' : u.position_uz || ''
}

function initials(u: User): string {
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

function unreadFor(userId: string): number {
  return unreadBySender.value[userId] || 0
}

function onSelectUser(row: User) {
  router.push({ name: 'chat.room', params: { userId: row.id } })
}

let searchTimer: number | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => { /* client-side filter computed orqali */ }, 200)
}

async function loadAll() {
  loading.value = true
  try {
    const [usersResp, countResp] = await Promise.all([
      usersApi.chatters(),
      chatApi.unreadCount(),
    ])
    users.value = usersResp.data
    const map: Record<string, number> = {}
    interface BySender { sender_id: string; count: number }
    const data = countResp.data as { count: number; by_sender?: BySender[] }
    if (data.by_sender) {
      for (const item of data.by_sender) {
        map[item.sender_id] = item.count
      }
    }
    unreadBySender.value = map
  } catch (_e) {
    ElMessage.error('Yuklanmadi')
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.partner {
  display: flex;
  align-items: center;
  gap: 12px;

  &__info {
    display: flex;
    flex-direction: column;
  }
  &__name {
    font-weight: 500;
  }
  &__pos {
    font-size: 13px;
    color: #909399;
  }
}
.muted {
  color: #c0c4cc;
}
</style>
