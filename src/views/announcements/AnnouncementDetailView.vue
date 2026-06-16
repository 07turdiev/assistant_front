<template>
  <el-card v-loading="loading" class="ann-page">
    <template #header>
      <div class="ann-page__header">
        <el-tooltip :content="$t('common.back')" placement="top">
          <el-button circle @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <span class="ann-page__title"><svg-icon icon-class="announcement" /> {{ $t('announcement.detailTitle') }}</span>
        <div v-if="canManage" class="ann-page__actions">
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button type="danger" circle @click="onDelete">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <div v-if="report" class="ann-card">
      <div class="ann-card__sender">
        <el-avatar :size="48" :src="report.sender?.avatar_url || undefined">
          {{ initials(report.sender) }}
        </el-avatar>
        <div class="ann-card__meta">
          <div class="ann-card__name">{{ formatUser(report.sender) }}</div>
          <div v-if="senderPosition" class="ann-card__position">{{ senderPosition }}</div>
          <div class="ann-card__when">{{ formatDateTime(report.created_at) }}</div>
        </div>
      </div>

      <p class="ann-card__desc">{{ report.description }}</p>

      <div class="ann-card__audience">
        <span class="muted">{{ $t('reports.audienceTo') }}:</span>
        <template v-if="report.target_directions && report.target_directions.length">
          <el-tag
            v-for="d in report.target_directions"
            :key="d.id"
            size="small"
            type="info"
          >
            {{ locale === 'ru' ? d.name_ru : d.name_uz }}
          </el-tag>
        </template>
        <el-tag v-else size="small" type="success">{{ $t('reports.audienceAll') }}</el-tag>
      </div>
    </div>

    <el-empty v-else-if="!loading" :description="$t('announcement.notFound')" />
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { showApiError } from '@/utils/api-error'
import { fullName } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Report } from '@/types/report'
import type { User } from '@/types/user'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const auth = useAuthStore()

const report = ref<Report | null>(null)
const loading = ref(false)

// Faqat yuboruvchi yoki super admin o'chira oladi
const canManage = computed(() => {
  if (!report.value || !auth.user) return false
  return report.value.sender?.id === auth.user.id || auth.hasRole('SUPER_ADMIN')
})

const senderPosition = computed(() => {
  const s = report.value?.sender
  if (!s) return ''
  return locale.value === 'ru' ? s.position_ru || '' : s.position_uz || ''
})

function formatUser(u?: User | null): string {
  return u ? fullName(u) : '—'
}

function initials(u?: User | null): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'dashboard' })
}

async function load() {
  loading.value = true
  try {
    const id = route.params.id as string
    const { data } = await reportsApi.retrieve(id)
    report.value = data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

async function onDelete() {
  if (!report.value) return
  const id = report.value.id
  try {
    await ElMessageBox.confirm(t('announcement.confirmDelete'), t('common.confirm'), { type: 'warning' })
  } catch {
    return // foydalanuvchi bekor qildi
  }
  try {
    await reportsApi.delete(id)
    ElMessage.success(t('common.success'))
    goBack()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.ann-page {
  max-width: 760px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title {
    font-weight: 600;
    font-size: 16px;
    color: #1f2d3d;
    flex: 1;
    min-width: 0;
  }

  &__actions {
    margin-left: auto;
  }
}

.ann-card {
  &__sender {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }

  &__name {
    font-weight: 600;
    font-size: 15px;
    color: #1f2d3d;
  }

  &__position {
    font-size: 12px;
    color: #5a6c7d;
    margin-top: 2px;
  }

  &__when {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  &__desc {
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.7;
    color: #1f2d3d;
    margin: 18px 0;
  }

  &__audience {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding-top: 14px;
    border-top: 1px solid #ebeef5;
  }
}

.muted {
  color: #909399;
  font-size: 12px;
}
</style>
