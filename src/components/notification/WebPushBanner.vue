<template>
  <el-alert
    v-if="webpush.shouldPromptBanner"
    class="webpush-banner"
    :class="{ 'webpush-banner--blocked': webpush.isBlocked }"
    :title="bannerTitle"
    :description="bannerDescription"
    type="error"
    :closable="false"
    show-icon
  >
    <template #default>
      <div class="webpush-banner__actions">
        <template v-if="webpush.isBlocked">
          <el-button type="danger" @click="showInstructions">
            <el-icon><InfoFilled /></el-icon>
            {{ $t('webpush.howToUnblock') }}
          </el-button>
        </template>
        <template v-else>
          <el-button type="danger" :loading="enabling" @click="enable">
            <el-icon><Bell /></el-icon>
            {{ $t('webpush.enable') }}
          </el-button>
          <el-button text @click="dismiss">{{ $t('webpush.dismiss') }}</el-button>
        </template>
      </div>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, InfoFilled } from '@element-plus/icons-vue'
import { useWebPushStore } from '@/stores/webpush'
import { useI18n } from 'vue-i18n'
import { showApiError } from '@/utils/api-error'

const webpush = useWebPushStore()
const { t } = useI18n()
const enabling = ref(false)

const bannerTitle = computed(() =>
  webpush.isBlocked ? t('webpush.blockedTitle') : t('webpush.bannerTitle'),
)

const bannerDescription = computed(() =>
  webpush.isBlocked ? t('webpush.blockedDescription') : t('webpush.bannerDescription'),
)

async function enable() {
  enabling.value = true
  try {
    await webpush.subscribe()
    if (webpush.status === 'subscribed') {
      ElMessage.success(t('webpush.subscribed'))
    } else if (webpush.status === 'denied') {
      // Foydalanuvchi brauzer modal'idan rad etdi — ogohlantirish ko'rsatamiz
      showInstructions()
    }
  } catch (e: unknown) {
    console.error(e)
    showApiError(e, t('webpush.subscribeError'))
  } finally {
    enabling.value = false
  }
}

function dismiss() {
  webpush.dismissBanner()
}

function showInstructions() {
  ElMessageBox.alert(t('webpush.unblockInstructions'), t('webpush.howToUnblock'), {
    confirmButtonText: t('common.confirm'),
    dangerouslyUseHTMLString: true,
  })
}
</script>

<style lang="scss" scoped>
.webpush-banner {
  margin-bottom: 16px;
  border-radius: 10px;
  border-left: 4px solid var(--el-color-danger);
  background: linear-gradient(
    90deg,
    rgba(245, 108, 108, 0.12) 0%,
    rgba(245, 108, 108, 0.06) 100%
  );
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.18);
  animation: webpush-pulse 2.2s ease-in-out infinite;

  /* Element Plus default rangi yumshoq qizil — uni yorqinroq qizilga o'tkazamiz */
  :deep(.el-alert__title) {
    color: var(--el-color-danger);
    font-weight: 600;
    font-size: 15px;
  }

  :deep(.el-alert__description) {
    color: var(--el-text-color-primary);
  }

  :deep(.el-alert__icon) {
    color: var(--el-color-danger);
    font-size: 22px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;

    .el-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }
}

/* E'tiborni jalb qiluvchi yumshoq pulse — keshov soya */
@keyframes webpush-pulse {
  0%, 100% {
    box-shadow: 0 2px 12px rgba(245, 108, 108, 0.18);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 108, 108, 0.40);
  }
}

/* Reduced-motion'ni hurmat qilamiz */
@media (prefers-reduced-motion: reduce) {
  .webpush-banner {
    animation: none;
  }
}
</style>
