<template>
  <el-alert
    v-if="webpush.shouldPromptBanner"
    class="webpush-banner"
    :title="$t('webpush.bannerTitle')"
    :description="$t('webpush.bannerDescription')"
    type="info"
    :closable="false"
    show-icon
  >
    <template #default>
      <div class="webpush-banner__actions">
        <el-button type="primary" :loading="enabling" @click="enable">
          {{ $t('webpush.enable') }}
        </el-button>
        <el-button @click="dismiss">{{ $t('webpush.dismiss') }}</el-button>
      </div>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebPushStore } from '@/stores/webpush'
import { useI18n } from 'vue-i18n'

const webpush = useWebPushStore()
const { t } = useI18n()
const enabling = ref(false)

async function enable() {
  enabling.value = true
  try {
    await webpush.subscribe()
    ElMessage.success(t('webpush.subscribed'))
  } catch (e) {
    console.error(e)
    ElMessage.error(t('webpush.subscribeError'))
  } finally {
    enabling.value = false
  }
}

function dismiss() {
  webpush.dismissBanner()
}
</script>

<style lang="scss" scoped>
.webpush-banner {
  margin-bottom: 16px;

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
