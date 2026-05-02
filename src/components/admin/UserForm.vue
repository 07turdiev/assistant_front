<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-position="top"
    @submit.prevent="onSubmit"
  >
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="$t('auth.username')" prop="username">
          <el-input v-model="model.username" :disabled="!isCreate" autocomplete="username" />
        </el-form-item>
      </el-col>
      <el-col v-if="isCreate" :span="12">
        <el-form-item :label="$t('auth.password')" prop="password">
          <el-input v-model="model.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="$t('admin.lastName')" prop="last_name">
          <el-input v-model="model.last_name" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.firstName')" prop="first_name">
          <el-input v-model="model.first_name" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.fatherName')">
          <el-input v-model="model.father_name" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="$t('admin.positionUz')" prop="position_uz">
          <el-input v-model="model.position_uz" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('admin.positionRu')" prop="position_ru">
          <el-input v-model="model.position_ru" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="$t('profile.phone')" prop="phone_number">
          <el-input v-model="model.phone_number" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('profile.email')">
          <el-input v-model="model.email" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="$t('admin.role')" prop="role_id">
          <el-select v-model="model.role_id" :placeholder="$t('common.search')" filterable>
            <el-option
              v-for="r in lookup.roles"
              :key="r.value"
              :value="parseInt(r.value, 10)"
              :label="r.label"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.status')" prop="status">
          <el-select v-model="model.status">
            <el-option v-for="s in lookup.statuses" :key="s.value" :value="s.value" :label="s.label" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.enabled')">
          <el-switch v-model="model.enabled" />
        </el-form-item>
      </el-col>
    </el-row>

    <div class="actions">
      <el-button type="primary" native-type="submit" :loading="submitting">
        {{ $t('common.save') }}
      </el-button>
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { useLookupStore } from '@/stores/lookup'
import type { AdminUserCreatePayload, AdminUserUpdatePayload } from '@/api/admin'
import type { User } from '@/types/user'

const props = defineProps<{
  user?: User | null
  isCreate: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: AdminUserCreatePayload | AdminUserUpdatePayload]
  cancel: []
}>()

const { t } = useI18n()
const lookup = useLookupStore()
const formRef = ref<FormInstance>()

const model = reactive<AdminUserCreatePayload>({
  username: '',
  first_name: '',
  last_name: '',
  father_name: '',
  position_uz: '',
  position_ru: '',
  phone_number: '',
  email: '',
  password: '',
  role_id: 0,
  direction_id: '',
  chief_id: null,
  status: 'AT_WORK',
  enabled: true,
})

const isCreate = computed(() => props.isCreate)

const rules: FormRules = {
  username: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  password: [
    {
      validator: (_rule, value, cb) => {
        if (props.isCreate && !value) cb(new Error(t('common.required')))
        else cb()
      },
      trigger: 'blur',
    },
  ],
  first_name: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  last_name: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  position_uz: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  position_ru: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  phone_number: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  role_id: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  status: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
}

watch(
  () => props.user,
  (u) => {
    if (!u) return
    Object.assign(model, {
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      father_name: u.father_name || '',
      position_uz: u.position_uz || '',
      position_ru: u.position_ru || '',
      phone_number: u.phone_number || '',
      email: u.email || '',
      password: '',
      role_id: u.role?.id ?? 0,
      direction_id: u.direction_id || '',
      chief_id: u.chief_id || null,
      status: u.status,
      enabled: u.enabled,
    })
  },
  { immediate: true }
)

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (props.isCreate) {
    emit('submit', { ...model })
  } else {
    const { password: _password, ...rest } = model
    emit('submit', rest)
  }
}

onMounted(() => lookup.loadAll())
</script>

<style lang="scss" scoped>
.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
