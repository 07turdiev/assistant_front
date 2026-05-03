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

      <div v-if="report.reply" class="reply-tag">
        <span class="muted">{{ $t('reports.reply') }}:</span>
        <el-tag :color="replyMetaColor"
                :style="{ color:'#fff', backgroundColor: replyMetaColor, border:'none' }">
          {{ replyMetaLabel }}
        </el-tag>
        <span v-if="report.reply_at" class="muted small">{{ formatDateTime(report.reply_at) }}</span>
      </div>
      <div v-else-if="report.notify_time" class="reply-tag">
        <span class="muted">{{ $t('reports.notifyLater') }}:</span>
        <el-tag size="small">{{ report.notify_time }} {{ $t('event.minutesBefore') }}</el-tag>
      </div>
    </div>

    <!-- Reply section (faqat receiver) -->
    <div v-if="canReply" class="reply-section">
      <p class="muted">{{ $t('reports.replyOption') }}:</p>
      <div class="reply-options">
        <el-tag
          v-for="opt in availableReplies"
          :key="opt.value"
          class="reply-option"
          :class="{ 'reply-option--selected': selectedReply === opt.value }"
          :style="optionStyle(opt)"
          @click="selectedReply = opt.value"
        >
          {{ opt.label }}
        </el-tag>
      </div>

      <div class="notify-time-row">
        <span class="muted small">{{ $t('reports.notifyLaterHint') }}</span>
        <el-input-number
          v-model="notifyTime"
          :min="1"
          :max="1440"
          :step="5"
          size="small"
          :placeholder="$t('reports.minutes')"
          style="width: 110px"
        />
      </div>

      <el-button
        type="primary"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="onSubmit"
        class="reply-btn"
      >
        {{ $t('common.save') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookup'
import { fullName } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Report } from '@/types/report'
import type { User } from '@/types/user'
import type { Choice } from '@/api/info'

const props = defineProps<{
  report: Report | null
  kind: 'task' | 'request'
}>()

const emit = defineEmits<{
  back: []
  replied: []
}>()

const { t } = useI18n()
const auth = useAuthStore()
const lookup = useLookupStore()

const selectedReply = ref<string | undefined>(undefined)
const notifyTime = ref<number | undefined>(undefined)
const submitting = ref(false)

const availableReplies = computed<Choice[]>(() =>
  props.kind === 'task' ? lookup.taskReplies : lookup.requestReplies
)

const canReply = computed(() => {
  if (!props.report || !auth.user) return false
  return props.report.receiver?.id === auth.user.id && !props.report.reply
})

const canSubmit = computed(() => Boolean(selectedReply.value || notifyTime.value))

const replyMetaLabel = computed(() => {
  if (!props.report?.reply) return ''
  return availableReplies.value.find((c) => c.value === props.report?.reply)?.label || props.report.reply
})

const replyMetaColor = computed(() => {
  if (!props.report?.reply) return '#909399'
  return availableReplies.value.find((c) => c.value === props.report?.reply)?.color || '#909399'
})

function formatUser(u: User | null | undefined): string {
  return u ? fullName(u) : '—'
}

function initialsFor(u: User | null | undefined): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

function optionStyle(opt: Choice) {
  if (selectedReply.value === opt.value) {
    return {
      color: '#fff',
      backgroundColor: opt.color || '#409eff',
      borderColor: opt.color || '#409eff',
      cursor: 'pointer',
    }
  }
  return {
    color: opt.color || '#5a6c7d',
    borderColor: opt.color || '#dcdfe6',
    cursor: 'pointer',
  }
}

async function onSubmit() {
  if (!props.report) return
  submitting.value = true
  try {
    await reportsApi.reply({
      report_id: props.report.id,
      reply: selectedReply.value,
      notify_time: notifyTime.value,
    })
    ElMessage.success(t('common.success'))
    emit('replied')
    emit('back')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    submitting.value = false
  }
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

.small {
  font-size: 11px;
}

.reply-section {
  border-top: 1px solid #ebeef5;
  padding: 12px 14px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reply-option {
  cursor: pointer;
  background: #fff;
  font-size: 12px;
}

.notify-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-btn {
  align-self: flex-start;
  margin-top: 4px;
}
</style>
