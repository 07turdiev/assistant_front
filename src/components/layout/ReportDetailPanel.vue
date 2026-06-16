<template>
  <div v-if="report" class="report-detail">
    <div class="header">
      <el-button link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <el-avatar :size="32" :src="report.sender?.avatar_url || undefined">
        {{ initialsFor(report.sender) }}
      </el-avatar>
      <div class="header__title">
        <div class="header__name">{{ formatUser(report.sender) }}</div>
        <div class="header__when">{{ formatDateTime(report.created_at) }}</div>
      </div>
    </div>

    <div class="body">
      <p class="description">{{ report.description }}</p>

      <!-- E'lon auditoriyasi: Hammaga yoki tanlangan bo'limlar -->
      <div class="reply-tag">
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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import { fullName } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Report } from '@/types/report'
import type { User } from '@/types/user'

defineProps<{
  report: Report | null
}>()

defineEmits<{ back: [] }>()

const { locale } = useI18n()

function formatUser(u: User | null | undefined): string {
  return u ? fullName(u) : '—'
}

function initialsFor(u: User | null | undefined): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}
</script>

<style lang="scss" scoped>
.report-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;

  &__title {
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-weight: 500;
    font-size: 14px;
  }

  &__when {
    font-size: 11px;
    color: #909399;
  }
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
}

.description {
  margin: 0 0 16px;
  white-space: pre-wrap;
  font-size: 14px;
  color: #1f2d3d;
}

.reply-tag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.muted {
  color: #909399;
  font-size: 12px;
}
</style>
