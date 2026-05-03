<template>
  <el-card v-loading="loading">
    <div v-if="user">
      <div class="header">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-avatar :size="84" :src="user.avatar_url || undefined" class="avatar">
          {{ initials }}
        </el-avatar>
        <div class="title">
          <h1 class="name">{{ formatUser(user) }}</h1>
          <el-tag :type="statusType">{{ statusLabel }}</el-tag>
        </div>
        <div class="spacer"></div>
        <el-button type="primary" @click="$router.push({ name: 'admin.users.edit', params: { id: user.id } })">
          {{ $t('common.edit') }}
        </el-button>
      </div>

      <h3 class="section-title">{{ $t('admin.userDetail.generalInfo') }}</h3>

      <el-descriptions :column="2" :border="false">
        <el-descriptions-item :label="$t('profile.phone')">
          {{ user.phone_number || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.userDetail.organisation')">
          {{ organisationName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.officeNumber')">
          {{ user.office_number || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.userDetail.direction')">
          {{ directionName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.email')">
          {{ user.email || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.position')">
          {{ position || '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="subordinates.length > 0">
        <h3 class="section-title">{{ $t('admin.userDetail.subordinates') }}</h3>
        <div class="subordinates">
          <div
            v-for="s in subordinates"
            :key="s.id"
            class="subordinate"
            @click="goToUser(s.id)"
          >
            <el-avatar :size="32" :src="s.avatar_url || undefined">
              {{ initialsFor(s) }}
            </el-avatar>
            <span>{{ formatUser(s) }}</span>
          </div>
        </div>
      </template>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { adminUsersApi } from '@/api/admin'
import { usersApi } from '@/api/users'
import { fullName } from '@/utils/format'
import type { User } from '@/types/user'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const user = ref<User | null>(null)
const subordinates = ref<User[]>([])
const directionName = ref('')
const organisationName = ref('')
const loading = ref(false)

const initials = computed(() => initialsFor(user.value))
const position = computed(() => {
  if (!user.value) return ''
  return locale.value === 'ru' ? user.value.position_ru || '' : user.value.position_uz || ''
})

const statusLabel = computed(() => {
  if (!user.value) return ''
  switch (user.value.status) {
    case 'AT_WORK': return t('userStatus.atWork')
    case 'ON_HOLIDAY': return t('userStatus.onHoliday')
    case 'WORK_TRIP': return t('userStatus.workTrip')
    case 'DISMISSED': return t('userStatus.dismissed')
    case 'IN_CHILDHOOD_RAISING': return t('userStatus.childcare')
    default: return user.value.status
  }
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const statusType = computed<TagType>(() => {
  if (!user.value) return 'info'
  switch (user.value.status) {
    case 'AT_WORK': return 'success'
    case 'DISMISSED': return 'info'
    default: return 'warning'
  }
})

function formatUser(u: User | null): string {
  return u ? fullName(u) : ''
}

function initialsFor(u: User | null): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

async function loadUser() {
  loading.value = true
  try {
    const id = route.params.id as string
    const { data } = await usersApi.fullInfo(id)
    user.value = data

    // Direction nomini olish
    if (data.direction_id) {
      try {
        const { data: dir } = await import('@/api/admin').then((m) => m.adminDirectionsApi.retrieve(data.direction_id!))
        directionName.value = locale.value === 'ru' ? dir.name_ru : dir.name_uz
      } catch (_e) { /* ignore */ }
    }

    // Subordinates'ni topish
    const { data: list } = await adminUsersApi.list({ page_size: 200 })
    subordinates.value = list.results.filter((u) => u.chief_id === data.id)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

function goToUser(id: string) {
  router.push({ name: 'admin.users.detail', params: { id } })
}

watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) loadUser()
})

onMounted(loadUser)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  .avatar {
    flex-shrink: 0;
  }

  .title {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .name {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
    }
  }

  .spacer {
    flex: 1;
  }
}

.section-title {
  margin: 24px 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #5a6c7d;
}

.subordinates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subordinate {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f5f7fa;
  }
}
</style>
