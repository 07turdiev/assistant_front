<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    size="large"
    class="login-form"
    @submit.prevent="onSubmit"
  >
    <el-form-item :label="$t('auth.username')" prop="username">
      <el-input
        v-model="form.username"
        autocomplete="username"
        :prefix-icon="User"
        :placeholder="$t('auth.username')"
      />
    </el-form-item>

    <el-form-item :label="$t('auth.password')" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        autocomplete="current-password"
        :prefix-icon="Lock"
        :placeholder="$t('auth.password')"
      />
    </el-form-item>

    <el-button
      type="primary"
      native-type="submit"
      :loading="auth.isLoading"
      class="login-btn"
    >
      {{ $t('auth.signIn') }}
      <el-icon class="login-btn__icon"><Right /></el-icon>
    </el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { type FormInstance, type FormRules } from 'element-plus'
import { Lock, Right, User } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { showApiError } from '@/utils/api-error'

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
    showApiError(e, t('auth.loginFailed'))
  }
}
</script>

<style lang="scss" scoped>
.login-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #1f2d3d;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    padding: 4px 14px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: box-shadow 0.15s ease, transform 0.15s ease;

    &:hover {
      box-shadow: 0 0 0 1px #9aa4af inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px #1a73e8 inset;
    }
  }

  :deep(.el-input__inner) {
    height: 44px;
    font-size: 14px;
  }

  :deep(.el-input__prefix-inner) {
    color: #909399;
    font-size: 17px;
    margin-right: 6px;
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, #1a73e8 0%, #1557b0 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(26, 115, 232, 0.35);
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(26, 115, 232, 0.25);
  }

  &__icon {
    font-size: 15px;
    transition: transform 0.15s ease;
  }

  &:hover &__icon {
    transform: translateX(2px);
  }
}
</style>
