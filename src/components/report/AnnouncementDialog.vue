<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('reports.announcementTitle')"
    width="480px"
    @update:model-value="emit('update:modelValue', $event)"
    @open="onOpen"
  >
    <el-form label-position="top">
      <el-form-item :label="$t('reports.description')" required>
        <el-input
          v-model="description"
          type="textarea"
          :rows="4"
          :placeholder="$t('reports.descriptionHint')"
        />
      </el-form-item>

      <!-- Auditoriya: Hammaga / tanlangan bo'limlar -->
      <el-form-item>
        <div class="audience-toggle">
          <span class="audience-toggle__label">{{ $t('reports.audienceAll') }}</span>
          <el-switch v-model="toAll" />
        </div>
      </el-form-item>

      <el-form-item v-if="!toAll" :label="$t('reports.audienceDirections')" required>
        <el-tree-select
          v-model="selectedDirections"
          :data="directionTree"
          :props="treeProps"
          node-key="id"
          multiple
          check-strictly
          show-checkbox
          check-on-click-node
          :render-after-expand="false"
          collapse-tags
          collapse-tags-tooltip
          clearable
          filterable
          :placeholder="$t('reports.audienceSelectHint')"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { reportsApi } from '@/api/reports'
import { adminDirectionsApi, type Direction } from '@/api/admin'
import { showApiError } from '@/utils/api-error'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; created: [] }>()

const { t, locale } = useI18n()

const description = ref('')
const toAll = ref(true)
const selectedDirections = ref<string[]>([])
const directionTree = ref<Direction[]>([])
const submitting = ref(false)
let loaded = false

// Daraxt yorlig'i joriy tilga qarab (uz / uz-Cyrl uchun name_uz, ru uchun name_ru)
const treeProps = computed(() => ({
  label: locale.value === 'ru' ? 'name_ru' : 'name_uz',
  children: 'children',
}))

async function onOpen() {
  description.value = ''
  toAll.value = true
  selectedDirections.value = []
  if (!loaded) {
    try {
      const { data } = await adminDirectionsApi.tree()
      directionTree.value = data
      loaded = true
    } catch (_e) {
      /* bo'lim daraxti yuklanmasa — faqat "Hammaga" varianti ishlaydi */
    }
  }
}

async function onSubmit() {
  const desc = description.value.trim()
  if (!desc) {
    ElMessage.warning(t('reports.description'))
    return
  }
  if (!toAll.value && selectedDirections.value.length === 0) {
    ElMessage.warning(t('reports.audienceSelectHint'))
    return
  }
  submitting.value = true
  try {
    await reportsApi.create({
      description: desc,
      target_direction_ids: toAll.value ? [] : selectedDirections.value,
    })
    ElMessage.success(t('common.success'))
    emit('created')
    emit('update:modelValue', false)
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.audience-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  &__label {
    font-size: 14px;
    color: #1f2d3d;
  }
}
</style>
