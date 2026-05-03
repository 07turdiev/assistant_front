<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>{{ $t('admin.createUser') }}</span>
        <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
      </div>
    </template>

    <UserForm
      :is-create="true"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="$router.back()"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import UserForm from '@/components/admin/UserForm.vue'
import { adminUsersApi, type AdminUserCreatePayload, type AdminUserUpdatePayload } from '@/api/admin'

const router = useRouter()
const { t } = useI18n()
const submitting = ref(false)

async function onSubmit(payload: AdminUserCreatePayload | AdminUserUpdatePayload) {
  submitting.value = true
  try {
    await adminUsersApi.create(payload as AdminUserCreatePayload)
    ElMessage.success(t('common.success'))
    router.push({ name: 'admin.users' })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } }
    const data = err.response?.data
    if (data?.errors && typeof data.errors === 'object') {
      const lines = Object.entries(data.errors).map(([field, msgs]) => {
        const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
        return `${field}: ${text}`
      })
      ElMessage({
        type: 'error',
        message: lines.join('\n'),
        duration: 6000,
        showClose: true,
        dangerouslyUseHTMLString: false,
      })
    } else {
      ElMessage.error(data?.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
