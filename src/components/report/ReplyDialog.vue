<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('reports.replyTitle')"
    width="480px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-tabs v-model="tab">
      <el-tab-pane :label="$t('reports.replyOption')" name="reply">
        <el-radio-group v-model="form.reply" class="reply-options">
          <el-radio
            v-for="opt in availableReplies"
            :key="opt.value"
            :value="opt.value"
            :style="{ borderColor: opt.color }"
          >
            <el-tag :color="opt.color" :style="{ color: '#fff', backgroundColor: opt.color, borderColor: opt.color }">
              {{ opt.label }}
            </el-tag>
          </el-radio>
        </el-radio-group>
      </el-tab-pane>

      <el-tab-pane :label="$t('reports.notifyLater')" name="notify_time">
        <p class="muted">{{ $t('reports.notifyLaterHint') }}</p>
        <el-input-number
          v-model="form.notify_time"
          :min="1"
          :max="1440"
          :step="5"
          :placeholder="$t('reports.minutes')"
        />
        <span class="muted ml-2">{{ $t('reports.minutes') }}</span>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { reportsApi } from '@/api/reports'
import { useLookupStore } from '@/stores/lookup'

const props = defineProps<{
  modelValue: boolean
  reportId: string | null
  kind: 'task' | 'request'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  replied: []
}>()

const { t } = useI18n()
const lookup = useLookupStore()
const submitting = ref(false)

const tab = ref<'reply' | 'notify_time'>('reply')
const form = reactive({
  reply: undefined as string | undefined,
  notify_time: undefined as number | undefined,
})

const availableReplies = computed(() => {
  return props.kind === 'task' ? lookup.taskReplies : lookup.requestReplies
})

const canSubmit = computed(() => {
  if (tab.value === 'reply') return Boolean(form.reply)
  return Boolean(form.notify_time && form.notify_time > 0)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.reply = undefined
      form.notify_time = undefined
      tab.value = 'reply'
    }
  }
)

async function onSubmit() {
  if (!props.reportId) return
  submitting.value = true
  try {
    const payload: { report_id: string; reply?: string; notify_time?: number } = {
      report_id: props.reportId,
    }
    if (tab.value === 'reply') payload.reply = form.reply
    else payload.notify_time = form.notify_time

    await reportsApi.reply(payload)
    ElMessage.success(t('common.success'))
    emit('replied')
    emit('update:modelValue', false)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.reply-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.muted {
  color: #909399;
  font-size: 13px;
}
.ml-2 {
  margin-left: 8px;
}
</style>
