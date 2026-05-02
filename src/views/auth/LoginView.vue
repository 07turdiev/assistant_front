<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    @submit.prevent="onSubmit"
  >
    <el-form-item :label="$t('auth.username')" prop="username">
      <el-input v-model="form.username" autocomplete="username" />
    </el-form-item>

    <el-form-item :label="$t('auth.password')" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        autocomplete="current-password"
      />
    </el-form-item>

    <el-button
      type="primary"
      native-type="submit"
      :loading="auth.isLoading"
      class="login-btn"
    >
      {{ $t('auth.signIn') }}
    </el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '' })

const rules: FormRules = {
  username: [{ required: true, message: () => t('auth.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: () => t('auth.passwordRequired'), trigger: 'blur' }],
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await auth.login(form.username, form.password)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('auth.loginFailed'))
  }
}
</script>

<style lang="scss" scoped>
.login-btn {
  width: 100%;
}
</style>
