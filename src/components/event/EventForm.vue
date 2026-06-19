<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
    <h2 class="form-title">{{ $t('event.formTitle') }}</h2>
    <el-divider class="title-divider" />

    <!-- Sana, Boshlanish vaqti, Tugash vaqti, Mavzusi -->
    <el-row :gutter="24">
      <el-col :span="6">
        <el-form-item :label="$t('event.executionDate')" prop="date" required>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('event.startTime')" prop="start_time" required>
          <el-time-picker v-model="form.start_time" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('event.endTime')" prop="end_time">
          <el-time-picker v-model="form.end_time" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="$t('event.subject')" prop="title" required>
          <el-input v-model="form.title" :placeholder="$t('event.subject')" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-form-item :label="$t('event.content')">
          <el-input v-model="form.description" type="textarea" :rows="5" :placeholder="$t('event.contentHint')" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.closed')">
          <div class="toggle-pair">
            <el-button :type="form.is_private ? 'primary' : ''" :plain="!form.is_private" class="toggle-btn" @click="form.is_private = true">
              {{ $t('common.yes') }}
            </el-button>
            <el-button :type="!form.is_private ? 'primary' : ''" :plain="form.is_private" class="toggle-btn" @click="form.is_private = false">
              {{ $t('common.no') }}
            </el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('event.executionType')" prop="type" required>
          <el-select v-model="form.type" :placeholder="$t('event.executionType')" style="width: 100%">
            <el-option v-for="ty in lookup.types" :key="ty.value" :value="ty.value" :label="ty.label" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.importantToggle')">
          <div class="toggle-pair">
            <el-button :type="form.is_important ? 'primary' : ''" :plain="!form.is_important" class="toggle-btn" @click="form.is_important = true">
              {{ $t('common.yes') }}
            </el-button>
            <el-button :type="!form.is_important ? 'primary' : ''" :plain="form.is_important" class="toggle-btn" @click="form.is_important = false">
              {{ $t('common.no') }}
            </el-button>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.reminderTime')">
          <el-select v-model="reminderMinutes" style="width: 100%">
            <el-option v-for="opt in reminderOptions" :key="opt" :value="opt" :label="reminderLabel(opt)" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- ===== Manzil — vazirlik binosi (zal) yoki boshqa hudud ===== -->
    <h3 class="section-title">{{ $t('event.locationTitle') }}</h3>
    <el-divider class="title-divider" />

    <div class="location-mode">
      <el-button
        :type="locationMode === 'hall' ? 'primary' : ''"
        :plain="locationMode !== 'hall'"
        class="toggle-btn"
        @click="setLocationMode('hall')"
      >
        <el-icon><OfficeBuilding /></el-icon>&nbsp;{{ $t('event.locationHall') }}
      </el-button>
      <el-button
        :type="locationMode === 'external' ? 'primary' : ''"
        :plain="locationMode !== 'external'"
        class="toggle-btn"
        @click="setLocationMode('external')"
      >
        <el-icon><LocationFilled /></el-icon>&nbsp;{{ $t('event.locationExternal') }}
      </el-button>
    </div>

    <!-- Vazirlik binosi: zal tanlash + jonli bandlik -->
    <el-row v-if="locationMode === 'hall'" :gutter="24">
      <el-col :span="12">
        <el-form-item :label="$t('event.hall')">
          <el-select
            v-model="form.hall_id"
            filterable
            clearable
            :placeholder="$t('event.selectHall')"
            style="width: 100%"
          >
            <el-option v-for="h in halls" :key="h.id" :value="h.id" :label="hallLabel(h)" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label=" ">
          <el-alert
            v-if="hallConflict"
            :title="hallConflict"
            type="error"
            :closable="false"
            show-icon
          />
          <el-alert
            v-else-if="form.hall_id && !hallChecking"
            :title="$t('event.hallFree')"
            type="success"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Boshqa hudud: viloyat + tuman + qo'shimcha manzil -->
    <el-row v-else :gutter="24">
      <el-col :span="8">
        <el-form-item :label="$t('event.region')">
          <el-select
            v-model="form.region_id"
            filterable
            clearable
            :placeholder="$t('event.region')"
            style="width: 100%"
            @change="onRegionChange"
          >
            <el-option
              v-for="r in regions"
              :key="r.id"
              :value="r.id"
              :label="localizeBilingual(r.name_uz, r.name_ru)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.district')">
          <el-select
            v-model="form.district_id"
            filterable
            clearable
            :disabled="!form.region_id"
            :placeholder="$t('event.district')"
            style="width: 100%"
          >
            <el-option
              v-for="d in districts"
              :key="d.id"
              :value="d.id"
              :label="localizeBilingual(d.name_uz, d.name_ru)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('event.address')">
          <el-input v-model="form.address" :placeholder="$t('event.addressHint')" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item>
      <el-upload class="big-upload" :auto-upload="false" :file-list="newFiles" :on-change="onFileChange" :on-remove="onFileRemove" multiple list-type="picture-card">
        <el-icon class="upload-icon"><DocumentAdd /></el-icon>
      </el-upload>
    </el-form-item>

    <div v-if="existingFiles.length > 0" class="existing-files">
      <p class="muted">{{ $t('event.existingFiles') }}</p>
      <div v-for="f in existingFiles" :key="f.id" class="existing-file">
        <a :href="f.url" target="_blank" class="file-link">
          <el-icon class="file-link__icon"><Paperclip /></el-icon>
          {{ f.file_name }}
        </a>
        <el-button size="small" type="danger" link @click="markFileForDeletion(f.id)">×</el-button>
      </div>
    </div>

    <h3 class="section-title">{{ $t('event.executors') }}</h3>
    <el-divider class="title-divider" />

    <!-- Yuqori rollar (VAZIR/ORINBOSAR/YORDAMCHI) — bo'lim/boshqarma tanlaydi (odam emas) -->
    <template v-if="selectsByDepartment">
      <el-form-item :label="$t('event.selectDepartments')" required>
        <el-tree-select
          v-model="form.participant_direction_ids"
          :data="directionTree"
          :props="treeProps"
          node-key="id"
          multiple
          check-strictly
          show-checkbox
          check-on-click-node
          collapse-tags
          collapse-tags-tooltip
          clearable
          filterable
          :placeholder="$t('event.selectDepartmentsHint')"
          style="width: 100%"
        />
      </el-form-item>
      <p class="muted">{{ $t('event.departmentHeadHint') }}</p>
    </template>

    <!-- BOSHLIQ — o'z jamoasini (quyi xodimlarini) tanlaydi -->
    <template v-else>
      <el-form-item :label="$t('event.selectMyTeam')" required>
        <div v-if="myTeam.length === 0" class="participants-empty">
          <el-icon class="participants-empty__icon"><UserIcon /></el-icon>
          <p class="participants-empty__text">{{ $t('event.noTeam') }}</p>
        </div>
        <div v-else class="participants-list">
          <div
            v-for="u in myTeam"
            :key="u.id"
            class="participant-row"
            :class="{
              'is-selected': form.participant_ids.includes(u.id),
              'is-unavailable': !isUserAvailable(u) && !form.participant_ids.includes(u.id),
            }"
            @click="toggleParticipant(u)"
          >
            <el-avatar :size="36" :src="u.avatar_url || undefined" class="participant-row__avatar">
              {{ initials(u) }}
            </el-avatar>
            <div class="participant-row__info">
              <span class="participant-row__name">{{ formatUser(u) }}</span>
              <span v-if="u.position_uz" class="participant-row__position">{{ localize(u.position_uz) }}</span>
            </div>
            <el-tag v-if="!isUserAvailable(u)" size="small" type="warning" effect="light" class="participant-row__badge participant-row__status-tag">
              <el-icon class="status-tag__icon"><Lock /></el-icon>
              {{ statusLabel(u.status) }}
            </el-tag>
            <div class="participant-row__check">
              <el-icon v-if="form.participant_ids.includes(u.id)"><Check /></el-icon>
            </div>
          </div>
        </div>
      </el-form-item>
    </template>

    <div class="actions">
      <el-button type="primary" native-type="submit" :loading="submitting">
        {{ $t('event.submitBtn') }}
      </el-button>
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Check, DocumentAdd, LocationFilled, Lock, OfficeBuilding, Paperclip, User as UserIcon } from '@element-plus/icons-vue'
import { useLookupStore } from '@/stores/lookup'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { adminDirectionsApi, adminRegionsApi, type Direction, type Region, type District } from '@/api/admin'
import { hallsApi, hallBookingsApi, type Hall } from '@/api/halls'
import { fullName } from '@/utils/format'
import { localize, localizeBilingual } from '@/utils/translit'
import type { Event, Visitor, Attachment } from '@/types/event'
import type { User, UserStatus } from '@/types/user'

interface FormShape {
  title: string
  date: string
  start_time: string
  end_time: string
  address: string
  hall_id: number | null
  region_id: number | null
  district_id: number | null
  description: string
  sphere: string
  type: string
  is_important: boolean
  is_private: boolean
  direction_id: string
  participant_ids: string[]
  participant_direction_ids: string[]
  notify_time_list: number[]
  visitors: Visitor[]
}

const props = defineProps<{
  event?: Event | null
  isCreate: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { dto: FormShape; files: File[]; deletedFileIds: string[] }]
  cancel: []
}>()

const { t, locale } = useI18n()
const lookup = useLookupStore()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

// Rolga qarab: yuqori rollar bo'lim tanlaydi, BOSHLIQ o'z jamoasini tanlaydi
const selectsByDepartment = computed(() => !auth.hasRole('BOSHLIQ'))

const reminderOptions = [5, 10, 15, 30, 60, 120, 1440]
const reminderMinutes = ref<number>(5)

function reminderLabel(min: number): string {
  if (min >= 1440) return t('event.reminder.day', { n: Math.floor(min / 1440) })
  if (min >= 60) return t('event.reminder.hour', { n: Math.floor(min / 60) })
  return t('event.reminder.min', { n: min })
}

const form = reactive<FormShape>({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  address: '',
  hall_id: null,
  region_id: null,
  district_id: null,
  description: '',
  sphere: 'VARIOUS_QUESTIONS',
  type: '',
  is_important: false,
  is_private: false,
  direction_id: '',
  participant_ids: [],
  participant_direction_ids: [],
  notify_time_list: [5],
  visitors: [],
})

// Bo'lim daraxti (yuqori rollar uchun)
const directionTree = ref<Direction[]>([])
const treeProps = computed(() => ({
  label: locale.value === 'ru' ? 'name_ru' : 'name_uz',
  children: 'children',
}))

// O'z jamoasi — quyi xodimlar (BOSHLIQ uchun)
const myTeam = ref<User[]>([])

// ===== Manzil: vazirlik binosi (zal) yoki tashqi hudud =====
const locationMode = ref<'hall' | 'external'>('hall')
const halls = ref<Hall[]>([])
const regions = ref<Region[]>([])
const districts = ref<District[]>([])
const hallConflict = ref('')
const hallChecking = ref(false)
const editingEventId = ref<string | null>(null)

function hallLabel(h: Hall): string {
  return `${t('halls.floorLabel', { n: h.floor })}: ${localize(h.name)}`
}

function setLocationMode(mode: 'hall' | 'external') {
  locationMode.value = mode
  if (mode === 'hall') {
    form.region_id = null
    form.district_id = null
  } else {
    form.hall_id = null
    hallConflict.value = ''
  }
}

async function loadDistricts(regionId: number) {
  try {
    const { data } = await adminRegionsApi.districts(regionId)
    districts.value = data
  } catch (_e) { /* ignore */ }
}

function onRegionChange() {
  form.district_id = null
  districts.value = []
  if (form.region_id) loadDistricts(form.region_id)
}

// Jonli bandlik tekshiruvi — zal/sana/vaqt o'zgarsa (350ms debounce)
let checkTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => [locationMode.value, form.hall_id, form.date, form.start_time, form.end_time],
  () => {
    hallConflict.value = ''
    if (locationMode.value !== 'hall' || !form.hall_id || !form.date || !form.start_time || !form.end_time) return
    if (checkTimer) clearTimeout(checkTimer)
    checkTimer = setTimeout(async () => {
      hallChecking.value = true
      try {
        const { data } = await hallBookingsApi.check({
          hall_id: form.hall_id as number,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          exclude_event_id: editingEventId.value || undefined,
        })
        hallConflict.value = data.available ? '' : (data.message || t('event.hallBusy'))
      } catch (_e) { /* ignore */ } finally {
        hallChecking.value = false
      }
    }, 350)
  },
)

const newFiles = ref<UploadFile[]>([])
const existingFiles = ref<Attachment[]>([])
const deletedFileIds = ref<string[]>([])

const rules: FormRules = {
  title: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  date: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  start_time: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
}

function formatUser(u: User | undefined | null): string {
  return u ? fullName(u) : ''
}

function initials(u: User): string {
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}

// Tanlanishi mumkin bo'lmagan statuslar — ta'tilda, ishdan bo'shagan, bola parvarishida
const UNAVAILABLE_STATUSES: ReadonlyArray<UserStatus> = [
  'ON_HOLIDAY',
  'DISMISSED',
  'IN_CHILDHOOD_RAISING',
]

function isUserAvailable(u: User | null | undefined): boolean {
  if (!u) return true
  return !UNAVAILABLE_STATUSES.includes(u.status)
}

function statusLabel(status: UserStatus): string {
  switch (status) {
    case 'ON_HOLIDAY': return t('userStatus.onHoliday')
    case 'WORK_TRIP': return t('userStatus.workTrip')
    case 'DISMISSED': return t('userStatus.dismissed')
    case 'IN_CHILDHOOD_RAISING': return t('userStatus.childcare')
    default: return t('userStatus.atWork')
  }
}

function notifyUnavailable(u: User) {
  ElMessage.warning(
    t('userStatus.unavailableSelect', {
      name: formatUser(u),
      status: statusLabel(u.status),
    }),
  )
}

function toggleParticipant(u: User) {
  const i = form.participant_ids.indexOf(u.id)
  if (i >= 0) {
    form.participant_ids.splice(i, 1)
    return
  }
  if (!isUserAvailable(u)) {
    notifyUnavailable(u)
    return
  }
  form.participant_ids.push(u.id)
}

function onFileChange(file: UploadFile) {
  if (!newFiles.value.find((f) => f.uid === file.uid)) {
    newFiles.value.push(file)
  }
}

function onFileRemove(file: UploadFile) {
  newFiles.value = newFiles.value.filter((f) => f.uid !== file.uid)
}

function markFileForDeletion(id: string) {
  deletedFileIds.value.push(id)
  existingFiles.value = existingFiles.value.filter((f) => f.id !== id)
}

watch(
  () => props.event,
  (e) => {
    if (!e) return
    form.title = e.title
    form.date = e.date
    form.start_time = e.start_time?.slice(0, 5)
    form.end_time = e.end_time?.slice(0, 5)
    form.address = e.address || ''
    // Manzil rejimini tadbirdan aniqlaymiz
    editingEventId.value = e.id
    if (e.hall) {
      locationMode.value = 'hall'
      form.hall_id = e.hall.id
      form.region_id = null
      form.district_id = null
    } else {
      locationMode.value = 'external'
      form.hall_id = null
      form.region_id = e.region?.id ?? null
      form.district_id = e.district?.id ?? null
      if (form.region_id) loadDistricts(form.region_id)
    }
    form.description = e.description || ''
    form.sphere = e.sphere || 'VARIOUS_QUESTIONS'
    form.type = e.type
    form.is_important = e.is_important
    form.is_private = e.is_private
    form.participant_ids = e.participants?.map((p) => p.id) || []
    form.participant_direction_ids = e.participant_directions?.map((d) => d.id) || []
    form.notify_time_list = [...(e.notify_time || [5])]
    form.visitors = (e.visitors || []).map((v) => ({ ...v }))
    existingFiles.value = e.files || []
    reminderMinutes.value = form.notify_time_list[0] || 5
  },
  { immediate: true },
)

async function onSubmit() {
  if (!formRef.value) return

  // Yo'nalish — joriy foydalanuvchidan (backend ham default beradi)
  if (!form.direction_id && auth.user?.direction_id) form.direction_id = auth.user.direction_id
  form.notify_time_list = [reminderMinutes.value]

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // Auditoriya validatsiyasi — rolga qarab
  if (selectsByDepartment.value && form.participant_direction_ids.length === 0) {
    ElMessage.warning(t('event.selectDepartmentsHint'))
    return
  }
  if (!selectsByDepartment.value && form.participant_ids.length === 0) {
    ElMessage.warning(t('event.selectMyTeam'))
    return
  }

  // Vazirlik binosi rejimi — zal tanlangan va band bo'lmasligi shart
  if (locationMode.value === 'hall') {
    if (!form.hall_id) {
      ElMessage.warning(t('event.selectHall'))
      return
    }
    if (hallConflict.value) {
      ElMessage.error(hallConflict.value)
      return
    }
  }

  const dto = { ...form }
  if (!dto.end_time && dto.start_time) {
    dto.end_time = addOneHour(dto.start_time)
  }
  // Rejimga qarab keraksiz manzil maydonlarini tozalaymiz
  if (locationMode.value === 'hall') {
    dto.region_id = null
    dto.district_id = null
    dto.address = ''
  } else {
    dto.hall_id = null
  }

  emit('submit', {
    dto,
    files: newFiles.value.map((f) => f.raw as File).filter(Boolean),
    deletedFileIds: [...deletedFileIds.value],
  })
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hh = (h + 1) % 24
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

onMounted(async () => {
  await lookup.loadAll()
  // Manzil ma'lumotlari: zallar + viloyatlar
  hallsApi.list().then(({ data }) => { halls.value = data }).catch(() => undefined)
  adminRegionsApi.list().then(({ data }) => { regions.value = data }).catch(() => undefined)
  if (selectsByDepartment.value) {
    try {
      const { data } = await adminDirectionsApi.tree()
      directionTree.value = data
    } catch (_e) { /* ignore */ }
  } else if (auth.user) {
    try {
      const { data } = await usersApi.subordinates(auth.user.id)
      myTeam.value = data
    } catch (_e) { /* ignore */ }
  }
})
</script>

<style lang="scss" scoped>
.form-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 500;
}

.section-title {
  margin: 24px 0 4px;
  font-size: 18px;
  font-weight: 500;
}

.title-divider {
  margin: 0 0 20px !important;
}

.toggle-pair {
  display: flex;
  width: 100%;

  .toggle-btn {
    flex: 1;
    border-radius: 0;
    margin-left: 0 !important;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}

.big-upload {
  :deep(.el-upload--picture-card) {
    width: 110px;
    height: 110px;
    background: #ecf5ff;
    border: 1px dashed transparent;
    color: #409eff;
  }

  .upload-icon {
    font-size: 36px;
  }
}

.existing-files {
  margin: 12px 0;

  .existing-file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 4px;

    a {
      color: #409eff;
      text-decoration: none;
    }
  }
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.file-link__icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.participants-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  width: 100%;
  background: #fafbfc;
  border: 1px dashed #e4e7ed;
  border-radius: 10px;
  color: #909399;

  &__icon {
    font-size: 32px;
    color: #c0c4cc;
    margin-bottom: 8px;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    text-align: center;
  }
}

.participants-list {
  width: 100%;
  max-height: 360px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 4px;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
    border: 2px solid #fff;
  }
  &::-webkit-scrollbar-thumb:hover { background: #c0c4cc; }
}

.participant-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.05s ease;
  position: relative;

  &__avatar {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    background: #ecf5ff;
    color: #409eff;
    border: 1px solid #d9ecff;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2d3d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__position {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  &__badge {
    flex-shrink: 0;
  }

  &__check {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid #dcdfe6;
    transition: all 0.15s ease;
    color: transparent;
    font-size: 13px;
  }

  &:hover {
    background: #f5f7fa;

    .participant-row__check {
      border-color: #c0c4cc;
    }
  }

  &:active {
    transform: scale(0.99);
  }

  &.is-selected {
    background: rgba(64, 158, 255, 0.08);

    .participant-row__name { color: #1976d2; }
    .participant-row__avatar {
      background: #409eff;
      color: #fff;
      border-color: #409eff;
    }
    .participant-row__check {
      background: #67c23a;
      border-color: #67c23a;
      color: #fff;
    }
  }

  &.is-unavailable {
    background: #fafafa;
    cursor: not-allowed;

    .participant-row__avatar {
      filter: grayscale(0.6);
      opacity: 0.7;
    }

    .participant-row__name {
      color: #909399;
      text-decoration: line-through;
      text-decoration-color: rgba(144, 147, 153, 0.5);
      text-decoration-thickness: 1px;
    }

    .participant-row__position {
      color: #c0c4cc;
    }

    .participant-row__check {
      border-color: #f0a020;
      background: rgba(240, 160, 32, 0.08);
    }

    &:hover {
      background: #fef6ec;
    }

    &:active {
      transform: none;
    }
  }
}

.participant-row__status-tag {
  display: inline-flex !important;
  align-items: center;
  gap: 4px;

  .status-tag__icon {
    font-size: 11px;
  }
}

.muted {
  color: #909399;
  font-size: 13px;
  margin: 4px 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}
</style>
