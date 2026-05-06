<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span>{{ $t('profile.editTitle') }}</span>
        <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
      </div>
    </template>

    <el-form ref="formRef" :model="form" label-position="top" @submit.prevent="onSubmit">
      <div class="avatar-row">
        <el-avatar :size="96" :src="avatarPreview || auth.user?.avatar_url || undefined">
          {{ initials }}
        </el-avatar>
        <el-upload
          :auto-upload="false"
          :on-change="onAvatarChange"
          :show-file-list="false"
          accept="image/*"
        >
          <el-button>{{ $t('profile.changeAvatar') }}</el-button>
        </el-upload>
      </div>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item :label="$t('admin.lastName')">
            <el-input v-model="form.last_name" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('admin.firstName')">
            <el-input v-model="form.first_name" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('admin.fatherName')">
            <el-input v-model="form.father_name" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$t('profile.phone')">
            <el-input v-model="form.phone_number" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('profile.email')">
            <el-input v-model="form.email" type="email" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$t('profile.officeNumber')">
            <el-input v-model="form.office_number" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="actions">
        <el-button type="primary" native-type="submit" :loading="submitting">
          {{ $t('common.save') }}
        </el-button>
        <el-button @click="$router.back()">{{ $t('common.cancel') }}</el-button>
      </div>

      <el-divider content-position="left">{{ $t('profile.changePasswordTitle') }}</el-divider>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item :label="$t('profile.oldPassword')">
            <el-input v-model="passwordForm.old_password" type="password" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('profile.newPassword')">
            <el-input v-model="passwordForm.new_password" type="password" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label=" ' ' ">
            <el-button
              type="primary"
              :loading="changingPassword"
              :disabled="!passwordForm.old_password || !passwordForm.new_password"
              @click="onChangePassword"
            >
              {{ $t('profile.changePassword') }}
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type UploadFile } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { showApiError } from '@/utils/api-error'

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const changingPassword = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const form = reactive({
  first_name: '',
  last_name: '',
  father_name: '',
  phone_number: '',
  email: '',
  office_number: '',
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
})

const initials = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name?.[0] || ''}${auth.user.first_name?.[0] || ''}`.toUpperCase()
})

function onAvatarChange(file: UploadFile) {
  if (file.raw) {
    avatarFile.value = file.raw
    avatarPreview.value = URL.createObjectURL(file.raw)
  }
}

function loadInitial() {
  if (!auth.user) return
  form.first_name = auth.user.first_name
  form.last_name = auth.user.last_name
  form.father_name = auth.user.father_name || ''
  form.phone_number = auth.user.phone_number || ''
  form.email = auth.user.email || ''
  form.office_number = auth.user.office_number || ''
}

async function onSubmit() {
  submitting.value = true
  try {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (avatarFile.value) fd.append('avatar', avatarFile.value)

    await usersApi.updateMe(fd)
    await auth.fetchMe()
    ElMessage.success(t('common.success'))
    router.push({ name: 'profile' })
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    submitting.value = false
  }
}

async function onChangePassword() {
  if (!passwordForm.old_password || !passwordForm.new_password) return
  changingPassword.value = true
  try {
    await usersApi.changePassword(passwordForm)
    ElMessage.success(t('common.success'))
    passwordForm.old_password = ''
    passwordForm.new_password = ''
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    changingPassword.value = false
  }
}

onMounted(loadInitial)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
