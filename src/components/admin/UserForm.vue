<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-position="top"
    @submit.prevent="onSubmit"
  >
    <!-- Login + Parol + Tasdiq parol -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('auth.username')" prop="username">
          <el-input v-model="model.username" :disabled="!isCreate" autocomplete="username" />
        </el-form-item>
      </el-col>
      <el-col v-if="isCreate" :span="8">
        <el-form-item :label="$t('auth.password')" prop="password">
          <el-input v-model="model.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-col>
      <el-col v-if="isCreate" :span="8">
        <el-form-item :label="$t('admin.userForm.confirmPassword')" prop="confirm_password">
          <el-input v-model="model.confirm_password" type="password" show-password />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- F.I.Sh. -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('admin.firstName')" prop="first_name">
          <el-input v-model="model.first_name" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.lastName')" prop="last_name">
          <el-input v-model="model.last_name" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.userForm.sharifi')">
          <el-input v-model="model.father_name" />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Telefon, Email, Tashkilot -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('profile.phone')" prop="phone_number">
          <el-input v-model="model.phone_number" placeholder="+998" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('profile.email')">
          <el-input v-model="model.email" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.userForm.organisation')">
          <el-select v-model="model.organisation_id" filterable style="width: 100%">
            <el-option
              v-for="o in organisations"
              :key="o.id"
              :value="o.id"
              :label="locale === 'ru' ? o.name_ru : o.name_uz"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Yo'nalish, Lavozim, Bosh'liq -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('admin.userForm.direction')" prop="direction_id">
          <el-select v-model="model.direction_id" filterable style="width: 100%">
            <el-option
              v-for="d in directions"
              :key="d.id"
              :value="d.id"
              :label="locale === 'ru' ? d.name_ru : d.name_uz"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.userForm.position')" prop="position">
          <el-input v-model="model.position" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.userForm.chief')">
          <el-select
            v-model="model.chief_id"
            filterable
            clearable
            remote
            :remote-method="searchChief"
            :loading="chiefSearching"
            style="width: 100%"
            :placeholder="$t('admin.userForm.chiefHint')"
          >
            <el-option
              v-for="u in chiefOptions"
              :key="u.id"
              :value="u.id"
              :label="formatUser(u)"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Rol, Ofis telefoni -->
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('admin.role')" prop="role_id">
          <el-select v-model="model.role_id" filterable :placeholder="$t('admin.userForm.selectRole')" style="width: 100%">
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
        <el-form-item :label="$t('admin.userForm.officePhone')">
          <el-input v-model="model.office_number" placeholder="+998" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('admin.status')" prop="status">
          <el-select v-model="model.status" style="width: 100%">
            <el-option v-for="s in lookup.statuses" :key="s.value" :value="s.value" :label="s.label" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item>
      <el-checkbox v-model="model.enabled">{{ $t('admin.enabled') }}</el-checkbox>
    </el-form-item>

    <!-- CompanyCar -->
    <el-divider content-position="left">
      <span class="company-car-title">
        {{ $t('admin.userForm.companyCar') }}
        <el-button type="primary" circle size="small" @click="toggleCompanyCar">
          <el-icon v-if="!hasCompanyCar"><Plus /></el-icon>
          <el-icon v-else><Minus /></el-icon>
        </el-button>
      </span>
    </el-divider>

    <el-row v-if="hasCompanyCar" :gutter="24">
      <el-col :span="6">
        <el-form-item :label="$t('admin.userForm.car.driver')">
          <el-input v-model="model.company_car!.driver" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('admin.userForm.car.model')">
          <el-input v-model="model.company_car!.model" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('admin.userForm.car.number')">
          <el-input v-model="model.company_car!.number" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('admin.userForm.car.driverPhone')">
          <el-input v-model="model.company_car!.driver_phone_number" placeholder="+998" />
        </el-form-item>
      </el-col>
    </el-row>

    <div class="actions">
      <el-button type="primary" native-type="submit" :loading="submitting">
        {{ isCreate ? $t('admin.userForm.submitCreate') : $t('common.save') }}
      </el-button>
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'
import { useLookupStore } from '@/stores/lookup'
import { adminDirectionsApi, adminOrganisationsApi, type Direction, type Organisation } from '@/api/admin'
import { usersApi } from '@/api/users'
import { fullName } from '@/utils/format'
import type { User } from '@/types/user'

interface CompanyCar {
  driver: string
  model: string
  number: string
  driver_phone_number: string
}

interface FormShape {
  username: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  father_name: string
  position: string
  position_uz: string
  position_ru: string
  phone_number: string
  email: string
  office_number: string
  organisation_id: string
  direction_id: string
  chief_id: string | null
  role_id: number
  status: 'AT_WORK' | 'ON_HOLIDAY' | 'WORK_TRIP' | 'DISMISSED' | 'IN_CHILDHOOD_RAISING'
  enabled: boolean
  company_car: CompanyCar | null
}

const props = defineProps<{
  user?: User | null
  isCreate: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  cancel: []
}>()

const { t, locale } = useI18n()
const lookup = useLookupStore()
const formRef = ref<FormInstance>()

const directions = ref<Direction[]>([])
const organisations = ref<Organisation[]>([])
const chiefOptions = ref<User[]>([])
const chiefSearching = ref(false)

const model = reactive<FormShape>({
  username: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  father_name: '',
  position: '',
  position_uz: '',
  position_ru: '',
  phone_number: '',
  email: '',
  office_number: '',
  organisation_id: '',
  direction_id: '',
  chief_id: null,
  role_id: 0,
  status: 'AT_WORK',
  enabled: true,
  company_car: null,
})

const hasCompanyCar = computed(() => model.company_car !== null)

function toggleCompanyCar() {
  if (model.company_car) {
    model.company_car = null
  } else {
    model.company_car = { driver: '', model: '', number: '', driver_phone_number: '' }
  }
}

const isCreate = computed(() => props.isCreate)

const rules: FormRules = {
  username: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  password: [{
    validator: (_r, val, cb) => {
      if (props.isCreate && !val) cb(new Error(t('common.required')))
      else cb()
    },
    trigger: 'blur',
  }],
  confirm_password: [{
    validator: (_r, val, cb) => {
      if (!props.isCreate) return cb()
      if (!val) cb(new Error(t('common.required')))
      else if (val !== model.password) cb(new Error(t('admin.userForm.passwordMismatch')))
      else cb()
    },
    trigger: 'blur',
  }],
  first_name: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  last_name: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  position: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  phone_number: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  role_id: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  status: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
}

function formatUser(u: User): string {
  return fullName(u)
}

let chiefTimer: number | null = null
async function searchChief(query: string) {
  if (chiefTimer) clearTimeout(chiefTimer)
  chiefTimer = window.setTimeout(async () => {
    chiefSearching.value = true
    try {
      const { data } = await usersApi.list({ search: query, page_size: 50 })
      chiefOptions.value = data.results
    } finally {
      chiefSearching.value = false
    }
  }, 300)
}

async function loadLookups() {
  const [d, o] = await Promise.all([
    adminDirectionsApi.list({ page_size: 200 }),
    adminOrganisationsApi.list({ page_size: 200 }),
  ])
  directions.value = d.data.results || []
  organisations.value = o.data.results || []
  if (organisations.value.length > 0 && !model.organisation_id) {
    model.organisation_id = organisations.value[0].id
  }
}

watch(
  () => props.user,
  async (u) => {
    if (!u) return
    Object.assign(model, {
      username: u.username,
      password: '',
      confirm_password: '',
      first_name: u.first_name,
      last_name: u.last_name,
      father_name: u.father_name || '',
      position: locale.value === 'ru' ? u.position_ru || '' : u.position_uz || '',
      position_uz: u.position_uz || '',
      position_ru: u.position_ru || '',
      phone_number: u.phone_number || '',
      email: u.email || '',
      office_number: u.office_number || '',
      direction_id: u.direction_id || '',
      organisation_id: u.organisation_id || '',
      chief_id: u.chief_id || null,
      role_id: u.role?.id ?? 0,
      status: u.status,
      enabled: u.enabled,
    })
    // Chief'ni options'ga qo'shish (display uchun)
    if (u.chief_id) {
      try {
        const { data } = await usersApi.fullInfo(u.chief_id)
        if (!chiefOptions.value.find((c) => c.id === data.id)) {
          chiefOptions.value.push(data)
        }
      } catch (_e) { /* ignore */ }
    }
  },
  { immediate: true }
)

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // Backend kutadigan format'ga moslash:
  // - position_uz/position_ru ikkalasiga bir xil qiymat (production'da single field)
  // - confirm_password ni tashlamoq
  const { confirm_password: _cp, position, ...rest } = model
  const payload = {
    ...rest,
    position_uz: position || rest.position_uz,
    position_ru: position || rest.position_ru,
  }
  if (!props.isCreate) {
    delete (payload as Record<string, unknown>).password
  }
  emit('submit', payload as Record<string, unknown>)
}

onMounted(() => {
  lookup.loadAll()
  loadLookups()
  searchChief('')
})
</script>

<style lang="scss" scoped>
.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.company-car-title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}
</style>
