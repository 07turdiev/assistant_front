<template>
  <el-dialog
    :model-value="modelValue"
    width="560px"
    class="ann-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="ann-head">
        <el-avatar :size="44" :src="report?.sender?.avatar_url || undefined">
          {{ initials(report?.sender) }}
        </el-avatar>
        <div class="ann-head__meta">
          <div class="ann-head__name">{{ formatUser(report?.sender) }}</div>
          <div class="ann-head__when">{{ report ? formatDateTime(report.created_at) : '' }}</div>
        </div>
      </div>
    </template>

    <div v-if="report" class="ann-body">
      <p class="ann-body__desc">{{ report.description }}</p>
      <div class="ann-body__audience">
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
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fullName } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Report } from '@/types/report'
import type { User } from '@/types/user'

defineProps<{ modelValue: boolean; report: Report | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const { locale } = useI18n()

function formatUser(u?: User | null): string {
  return u ? fullName(u) : '—'
}

function initials(u?: User | null): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}
</script>

<style lang="scss" scoped>
.ann-head {
  display: flex;
  align-items: center;
  gap: 12px;

  &__name {
    font-weight: 600;
    font-size: 15px;
    color: #1f2d3d;
  }

  &__when {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

.ann-body {
  &__desc {
    white-space: pre-wrap;
    font-size: 14px;
    line-height: 1.6;
    color: #1f2d3d;
    margin: 0 0 16px;
  }

  &__audience {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}

.muted {
  color: #909399;
  font-size: 12px;
}
</style>
