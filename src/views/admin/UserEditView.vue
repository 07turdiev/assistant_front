<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('admin.editUser') }}</span>
        <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
      </div>
    </template>

    <UserForm
      v-if="user"
      :user="user"
      :is-create="false"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="$router.back()"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import UserForm from '@/components/admin/UserForm.vue'
import { adminUsersApi, type AdminUserCreatePayload, type AdminUserUpdatePayload } from '@/api/admin'
import type { User } from '@/types/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const user = ref<User | null>(null)
const loading = ref(true)
const submitting = ref(false)

async function load() {
  loading.value = true
  try {
    const id = route.params.id as string
    const { data } = await adminUsersApi.retrieve(id)
    user.value = data
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function onSubmit(payload: AdminUserCreatePayload | AdminUserUpdatePayload) {
  if (!user.value) return
  submitting.value = true
  try {
    await adminUsersApi.update(user.value.id, payload as AdminUserUpdatePayload)
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
      ElMessage({ type: 'error', message: lines.join('\n'), duration: 6000, showClose: true })
    } else {
      ElMessage.error(data?.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
