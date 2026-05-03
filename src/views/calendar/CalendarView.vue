<template>
  <el-card class="calendar-card" v-loading="loading">
    <template #header>
      <div class="header">
        <span class="title">{{ $t('nav.calendar') }}</span>

        <el-button-group>
          <el-button :type="view === 'multiMonthYear' ? 'primary' : ''" @click="changeView('multiMonthYear')">
            {{ $t('calendar.year') }}
          </el-button>
          <el-button :type="view === 'dayGridMonth' ? 'primary' : ''" @click="changeView('dayGridMonth')">
            {{ $t('calendar.month') }}
          </el-button>
          <el-button :type="view === 'timeGridWeek' ? 'primary' : ''" @click="changeView('timeGridWeek')">
            {{ $t('calendar.week') }}
          </el-button>
          <el-button :type="view === 'timeGridDay' ? 'primary' : ''" @click="changeView('timeGridDay')">
            {{ $t('calendar.day') }}
          </el-button>
        </el-button-group>

        <div class="actions">
          <el-button
            v-if="canCreateEvent"
            type="primary"
            @click="$router.push({ name: 'events.create' })"
          >
            + {{ $t('event.create') }}
          </el-button>
          <el-button
            v-if="canCreateTask"
            type="success"
            @click="taskDialogVisible = true"
          >
            + {{ $t('reports.create') }}
          </el-button>
        </div>
      </div>
    </template>

    <FullCalendar ref="calendarRef" :options="calendarOptions" />

    <!-- Tezkor topshiriq/so'rov dialogi -->
    <el-dialog v-model="taskDialogVisible" :title="taskDialogTitle" width="520px">
      <el-form :model="taskForm" label-position="top">
        <el-form-item :label="$t('reports.description')" required>
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('reports.descriptionHint')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creatingTask" @click="onCreateTask">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import type { CalendarOptions, EventClickArg, DatesSetArg, EventInput } from '@fullcalendar/core'

import { eventsApi } from '@/api/events'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/date'
import type { Event } from '@/types/event'

const router = useRouter()
const { t, locale } = useI18n()
const auth = useAuthStore()

const canCreateEvent = computed(() =>
  auth.hasRole('PREMIER_MINISTER', 'VICE_MINISTER', 'ASSISTANT_PREMIER', 'HEAD', 'ASSISTANT')
)
const canCreateTask = computed(() =>
  auth.hasRole('PREMIER_MINISTER', 'HEAD', 'ASSISTANT', 'ASSISTANT_PREMIER')
)

const taskDialogVisible = ref(false)
const creatingTask = ref(false)
const taskForm = reactive({ description: '' })

const taskDialogTitle = computed(() => {
  if (auth.hasRole('PREMIER_MINISTER', 'HEAD')) return t('reports.taskTitle')
  if (auth.hasRole('ASSISTANT', 'ASSISTANT_PREMIER')) return t('reports.requestTitle')
  return t('reports.create')
})

async function onCreateTask() {
  if (!taskForm.description.trim()) return
  creatingTask.value = true
  try {
    await reportsApi.create({ description: taskForm.description.trim() })
    ElMessage.success(t('common.success'))
    taskForm.description = ''
    taskDialogVisible.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || t('common.error'))
  } finally {
    creatingTask.value = false
  }
}

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const view = ref<'multiMonthYear' | 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth')
const events = ref<Event[]>([])
const loading = ref(false)

const fcEvents = computed<EventInput[]>(() =>
  events.value.map((e) => ({
    id: e.id,
    title: e.title,
    start: `${e.date}T${e.start_time}`,
    end: `${e.date}T${e.end_time}`,
    backgroundColor: e.is_important ? '#f56c6c' : '#409eff',
    borderColor: e.is_important ? '#f56c6c' : '#409eff',
    extendedProps: { sphere: e.sphere, type: e.type, address: e.address },
  }))
)

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
  initialView: view.value,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  buttonText: {
    today: t('calendar.today'),
  },
  locale: locale.value === 'ru' ? 'ru' : 'en',
  firstDay: 1,
  weekends: true,
  height: 'auto',
  events: fcEvents.value,
  eventClick: onEventClick,
  datesSet: onDatesSet,
  dayMaxEvents: 3,
  nowIndicator: true,
  navLinks: true,
  navLinkDayClick: onNavToDay,
  multiMonthMaxColumns: 3,
}))

function changeView(newView: typeof view.value) {
  view.value = newView
  const api = calendarRef.value?.getApi()
  if (api) api.changeView(newView)
}

function onEventClick(arg: EventClickArg) {
  router.push({ name: 'events.detail', params: { id: arg.event.id } })
}

function onNavToDay(date: Date) {
  view.value = 'timeGridDay'
  const api = calendarRef.value?.getApi()
  if (api) {
    api.changeView('timeGridDay', date)
  }
}

async function onDatesSet(arg: DatesSetArg) {
  // Yangi diapazon ko'rsatildi — backendning by-period endpoint'idan tortamiz
  const start = formatDate(arg.start, 'YYYY-MM-DD')
  const end = formatDate(arg.end, 'YYYY-MM-DD')
  await loadEvents(start, end)
}

async function loadEvents(startDate: string, endDate: string) {
  loading.value = true
  try {
    const { data } = await eventsApi.byPeriod({ start_date: startDate, end_date: endDate })
    events.value = data
  } catch (_e) {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Calendar API onMount'dan keyin tayyor — datesSet avtomatik ishga tushadi
})
</script>

<style lang="scss" scoped>
.calendar-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .title {
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
}

:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-toolbar-title) {
  font-size: 16px !important;
  font-weight: 600;
}

:deep(.fc-button-primary) {
  background-color: #1976d2;
  border-color: #1976d2;
  text-transform: capitalize;

  &:hover, &:not(:disabled).fc-button-active, &:not(:disabled):active {
    background-color: #155fa0;
    border-color: #155fa0;
  }
}

:deep(.fc-event) {
  cursor: pointer;
  font-size: 12px;
  padding: 1px 3px;
}

:deep(.fc-daygrid-day-number),
:deep(.fc-col-header-cell-cushion) {
  color: #1f2d3d;
  text-decoration: none;
}
</style>
