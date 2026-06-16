<template>
  <div class="dashboard">
    <h1>{{ $t('dashboard.welcome', { name: fullName }) }}</h1>

    <el-row :gutter="16" class="dashboard__stats">
      <el-col :xs="12" :sm="12" :md="8" :lg="8">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('dashboard.announcements') }}</span>
            <span class="stat__value">{{ announcementCount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="8" :lg="8">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('dashboard.unreadChat') }}</span>
            <span class="stat__value">{{ chat.unreadCount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="8" :lg="8">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('dashboard.notifications') }}</span>
            <span class="stat__value">{{ notifications.unreadCount }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="dashboard__placeholder">
      <p>{{ $t('dashboard.todayPlaceholder') }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationsStore } from '@/stores/notifications'
import { reportsApi } from '@/api/reports'

const auth = useAuthStore()
const chat = useChatStore()
const notifications = useNotificationsStore()

const announcementCount = ref(0)

const fullName = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.first_name} ${auth.user.last_name}`.trim()
})

onMounted(async () => {
  try {
    const r = await reportsApi.announcementsCount()
    announcementCount.value = r.data.count
  } catch (_e) {
    // silently — backend tayyor bo'lmasa ham dashboard ochilsin
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.dashboard {
  h1 {
    margin: 0 0 24px;
    font-size: 20px;
    color: #1f2d3d;
  }

  &__stats {
    margin-bottom: 24px;
    row-gap: 12px;
  }

  &__placeholder {
    color: #5a6c7d;
  }
}

.stat {
  display: flex;
  flex-direction: column;

  &__label {
    font-size: 13px;
    color: #5a6c7d;
    margin-bottom: 4px;
  }
  &__value {
    font-size: 28px;
    font-weight: 600;
    color: #1f2d3d;
  }
}

@include mobile {
  .dashboard {
    h1 {
      font-size: 18px;
      margin-bottom: 16px;
    }

    &__stats {
      margin-bottom: 16px;
    }
  }

  .stat__value {
    font-size: 22px;
  }
}
</style>
