<template>
  <el-card>
    <template #header>
      <h2>{{ $t('webpush.settings') }}</h2>
    </template>

    <p v-if="!webpush.isSupported" class="muted">
      {{ $t('webpush.unsupported') }}
    </p>

    <template v-else>
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="$t('webpush.status')">
          <el-tag :type="statusTag">{{ statusLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('webpush.permission')">
          {{ permission }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button
          v-if="webpush.status !== 'subscribed'"
          type="primary"
          :loading="busy"
          @click="onSubscribe"
        >
          {{ $t('webpush.enable') }}
        </el-button>

        <el-button
          v-if="webpush.status === 'subscribed'"
          type="danger"
          :loading="busy"
          @click="onUnsubscribe"
        >
          {{ $t('webpush.disable') }}
        </el-button>

        <el-button @click="onTest" :disabled="webpush.status !== 'subscribed'">
          {{ $t('webpush.sendTest') }}
        </el-button>
      </div>

      <h3 class="section-title">{{ $t('webpush.activeSubscriptions') }}</h3>

      <el-empty v-if="webpush.subscriptions.length === 0" :description="$t('webpush.noSubs')" />
      <el-table v-else :data="webpush.subscriptions" stripe>
        <el-table-column prop="user_agent" :label="$t('webpush.device')" />
        <el-table-column prop="created_at" :label="$t('webpush.createdAt')" width="200">
          <template #default="{ row }">{{ row.created_at?.slice(0, 16) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="onRemove(row.id)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useWebPushStore } from '@/stores/webpush'
import { webpushApi } from '@/api/webpush'
import { showApiError } from '@/utils/api-error'

const webpush = useWebPushStore()
const { t } = useI18n()
const busy = ref(false)

const permission = computed(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unknown'))

const statusTag = computed(() => {
  switch (webpush.status) {
    case 'subscribed':
      return 'success'
    case 'denied':
      return 'danger'
    default:
      return 'info'
  }
})

const statusLabel = computed(() => t(`webpush.statusLabel.${webpush.status}`))

async function refresh() {
  await webpush.init()
  if (webpush.status === 'subscribed') {
    await webpush.fetchSubscriptions()
  }
}

async function onSubscribe() {
  busy.value = true
  try {
    await webpush.subscribe()
    await webpush.fetchSubscriptions()
    ElMessage.success(t('webpush.subscribed'))
  } catch (e: unknown) {
    showApiError(e, t('webpush.subscribeError'))
  } finally {
    busy.value = false
  }
}

async function onUnsubscribe() {
  busy.value = true
  try {
    await webpush.unsubscribe()
    await webpush.fetchSubscriptions()
  } finally {
    busy.value = false
  }
}

async function onTest() {
  try {
    await webpushApi.test()
    ElMessage.success(t('webpush.testSent'))
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

async function onRemove(id: string) {
  await webpushApi.unsubscribe(id)
  await webpush.fetchSubscriptions()
}

onMounted(refresh)
</script>

<style lang="scss" scoped>
.muted {
  color: #909399;
}
.actions {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}
.section-title {
  margin: 24px 0 12px;
  font-size: 16px;
}
</style>
