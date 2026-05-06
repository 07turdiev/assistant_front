<template>
  <div class="calendar-page" v-loading="loading">
    <!-- Toolbar -->
    <div class="cal-toolbar">
      <div class="cal-toolbar__left">
        <el-button-group class="nav-group">
          <el-tooltip :content="$t('calendar.prev')" placement="top">
            <el-button :icon="ArrowLeft" @click="navPrev" />
          </el-tooltip>
          <el-button class="today-btn" @click="navToday">{{ $t('calendar.today') }}</el-button>
          <el-tooltip :content="$t('calendar.next')" placement="top">
            <el-button :icon="ArrowRight" @click="navNext" />
          </el-tooltip>
        </el-button-group>
        <h2 class="cal-title">{{ currentTitle }}</h2>
      </div>

      <div class="cal-toolbar__center">
        <el-segmented
          :model-value="view"
          :options="viewOptions"
          @change="onSegmentedChange"
        />
      </div>

      <div class="cal-toolbar__right">
        <el-tooltip v-if="canCreateTask" :content="taskDialogTitle" placement="top">
          <el-button type="success" circle size="large" @click="taskDialogVisible = true">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="canCreateEvent" :content="$t('event.create')" placement="top">
          <el-button type="primary" circle size="large" @click="$router.push({ name: 'events.create' })">
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="stats-strip">
      <div class="stat">
        <span class="stat__value">{{ events.length }}</span>
        <span class="stat__label">{{ $t('calendar.totalEvents') }}</span>
      </div>
      <div class="stat stat--important">
        <span class="stat__value">{{ importantCount }}</span>
        <span class="stat__label">{{ $t('calendar.importantEvents') }}</span>
      </div>
      <div class="stat stat--private">
        <span class="stat__value">{{ privateCount }}</span>
        <span class="stat__label">{{ $t('calendar.privateEvents') }}</span>
      </div>
      <div class="legend">
        <div v-for="(color, type) in typeColors" :key="type" class="legend-item">
          <span class="legend-dot" :style="{ background: color }"></span>
          <span class="legend-label">{{ typeLabels[type] || type }}</span>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="cal-card">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Document, Plus } from '@element-plus/icons-vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import type { CalendarOptions, EventClickArg, DatesSetArg, EventInput, EventContentArg, LocaleInput } from '@fullcalendar/core'

import { eventsApi } from '@/api/events'
import { reportsApi } from '@/api/reports'
import { showApiError } from '@/utils/api-error'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/date'
import type { Event } from '@/types/event'

// ---- O'zbek (Latin) oy va hafta nomlari ----
const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]
const UZ_DAYS_SHORT = ['Yak', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha']
const UZ_DAYS_LONG = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

const UZ_CYR_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const UZ_CYR_DAYS_SHORT = ['Як', 'Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша']
const UZ_CYR_DAYS_LONG = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба']

const uzLocale: LocaleInput = {
  code: 'uz',
  firstDay: 1,
  buttonText: {
    prev: 'Oldingi',
    next: 'Keyingi',
    today: 'Bugun',
    year: 'Yil',
    month: 'Oy',
    week: 'Hafta',
    day: 'Kun',
    list: "Ro'yxat",
  },
  weekText: 'Hafta',
  allDayText: "Kun bo'yi",
  moreLinkText: (n: number) => `+${n} ko'proq`,
  noEventsText: "Tadbir yo'q",
}

const uzCyrlLocale: LocaleInput = {
  code: 'uz-Cyrl',
  firstDay: 1,
  buttonText: {
    prev: 'Олдинги',
    next: 'Кейинги',
    today: 'Бугун',
    year: 'Йил',
    month: 'Ой',
    week: 'Ҳафта',
    day: 'Кун',
    list: 'Рўйхат',
  },
  weekText: 'Ҳафта',
  allDayText: 'Кун бўйи',
  moreLinkText: (n) => `+${n} кўпроқ`,
  noEventsText: 'Тадбир йўқ',
}

const ruLocale: LocaleInput = {
  code: 'ru',
  firstDay: 1,
  buttonText: {
    prev: 'Назад',
    next: 'Вперёд',
    today: 'Сегодня',
    year: 'Год',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    list: 'Список',
  },
  weekText: 'Нед',
  allDayText: 'Весь день',
  moreLinkText: (n: number) => `Ещё ${n}`,
  noEventsText: 'Нет мероприятий',
}

function uzFormat(date: Date, opts?: { month?: 'long' | 'short'; weekday?: 'long' | 'short' | 'narrow'; day?: 'numeric'; year?: 'numeric' }, cyrl = false): string {
  const months = cyrl ? UZ_CYR_MONTHS : UZ_MONTHS
  const daysShort = cyrl ? UZ_CYR_DAYS_SHORT : UZ_DAYS_SHORT
  const daysLong = cyrl ? UZ_CYR_DAYS_LONG : UZ_DAYS_LONG
  const parts: string[] = []
  if (opts?.weekday === 'long') parts.push(daysLong[date.getUTCDay()])
  else if (opts?.weekday === 'short') parts.push(daysShort[date.getUTCDay()])
  if (opts?.day) parts.push(String(date.getUTCDate()))
  if (opts?.month === 'long') parts.push(months[date.getUTCMonth()])
  else if (opts?.month === 'short') parts.push(months[date.getUTCMonth()].slice(0, 3))
  if (opts?.year) parts.push(String(date.getUTCFullYear()))
  return parts.join(' ')
}

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
    showApiError(e, t('common.error'))
  } finally {
    creatingTask.value = false
  }
}

// EventType -> color mapping (production enum'i)
const typeColors: Record<string, string> = {
  Collection: '#5470c6',
  Presidium: '#91cc75',
  Selector: '#fac858',
  Discussion: '#ee6666',
  Presentation: '#73c0de',
  Meeting: '#3ba272',
  Forum: '#fc8452',
  Seminar: '#9a60b4',
}

const typeLabels = computed<Record<string, string>>(() => {
  const isCyr = locale.value === 'uz-Cyrl'
  const isRu = locale.value === 'ru'
  return {
    Collection: isRu ? 'Собрание' : isCyr ? "Йиғилиш" : "Yig'ilish",
    Presidium: isRu ? 'Президиум' : isCyr ? 'Президиум' : 'Prezidium',
    Selector: isRu ? 'Селектор' : isCyr ? 'Селектор' : 'Selektor',
    Discussion: isRu ? 'Обсуждение' : isCyr ? 'Муҳокама' : 'Muhokama',
    Presentation: isRu ? 'Презентация' : isCyr ? 'Тақдимот' : 'Taqdimot',
    Meeting: isRu ? 'Встреча' : isCyr ? 'Учрашув' : 'Uchrashuv',
    Forum: 'Forum',
    Seminar: 'Seminar',
  }
})

type CalView = 'multiMonthYear' | 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const view = ref<CalView>('dayGridMonth')
const events = ref<Event[]>([])
const loading = ref(false)
const currentTitle = ref('')

const importantCount = computed(() => events.value.filter((e) => e.is_important).length)
const privateCount = computed(() => events.value.filter((e) => e.is_private).length)

const viewOptions = computed(() => [
  { label: t('calendar.year'), value: 'multiMonthYear' },
  { label: t('calendar.month'), value: 'dayGridMonth' },
  { label: t('calendar.week'), value: 'timeGridWeek' },
  { label: t('calendar.day'), value: 'timeGridDay' },
])

function colorFor(e: Event): string {
  return typeColors[e.type] || '#909399'
}

const fcEvents = computed<EventInput[]>(() =>
  events.value.map((e) => {
    const base = colorFor(e)
    return {
      id: e.id,
      title: e.title,
      start: `${e.date}T${e.start_time}`,
      end: `${e.date}T${e.end_time}`,
      backgroundColor: base,
      borderColor: base,
      classNames: [
        'event-pill',
        e.is_important ? 'is-important' : '',
        e.is_private ? 'is-private' : '',
      ].filter(Boolean),
      extendedProps: {
        sphere: e.sphere,
        type: e.type,
        address: e.address,
        is_important: e.is_important,
        is_private: e.is_private,
        start_time: e.start_time,
      },
    }
  })
)

const calendarOptions = computed<CalendarOptions>(() => {
  const isRu = locale.value === 'ru'
  const isCyrl = locale.value === 'uz-Cyrl'
  const isUz = !isRu // uz yoki uz-Cyrl
  const fcLocale = isRu ? 'ru' : isCyrl ? 'uz-Cyrl' : 'uz'
  const daysShort = isCyrl ? UZ_CYR_DAYS_SHORT : UZ_DAYS_SHORT
  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
    initialView: view.value,
    headerToolbar: false,
    locales: [uzLocale, uzCyrlLocale, ruLocale],
    locale: fcLocale,
    firstDay: 1,
    weekends: true,
    height: 'auto',
    expandRows: true,
    // Diqqat: events bu yerda BERILMAYDI — `watch(events, ...)` orqali API
    // bilan yangilanadi, aks holda har data fetch FullCalendar'ni qayta
    // render qiladi va datesSet qayta ishga tushib cheksiz loop yaratadi.
    eventClick: onEventClick,
    datesSet: onDatesSet,
    dayMaxEvents: 3,
    nowIndicator: true,
    navLinks: true,
    navLinkDayClick: onNavToDay,
    // Yil view: 1 ustun × 12 qator — har oy butun ekran kengligida (oy view kabi)
    multiMonthMaxColumns: 1,
    multiMonthMinWidth: 600,
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    allDaySlot: false,
    scrollTime: '08:00:00',
    businessHours: { daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
    eventContent: renderEventContent,
    // O'zbek lokalida hafta nomlari va oy nomlarini qo'lda formatlaymiz
    dayHeaderFormat: isUz
      ? (arg: { date: { marker: Date } }) => daysShort[arg.date.marker.getUTCDay()]
      : { weekday: 'short' },
    multiMonthTitleFormat: isUz
      ? (arg: { date: { marker: Date } }) => uzFormat(arg.date.marker, { month: 'long', year: 'numeric' }, isCyrl)
      : { year: 'numeric', month: 'long' },
    titleFormat: isUz
      ? (arg: { date: { marker: Date } }) => uzFormat(arg.date.marker, { month: 'long', year: 'numeric' }, isCyrl)
      : { year: 'numeric', month: 'long' },
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  } as CalendarOptions
})

function renderEventContent(arg: EventContentArg) {
  const time = arg.event.extendedProps.start_time as string | undefined
  const isImportant = arg.event.extendedProps.is_important as boolean
  const isPrivate = arg.event.extendedProps.is_private as boolean
  const timeStr = time ? time.slice(0, 5) : ''
  const isMonthView = arg.view.type === 'dayGridMonth' || arg.view.type === 'multiMonthYear'

  const bg = arg.event.backgroundColor || '#409eff'
  const html = isMonthView
    ? `
      <div class="ev-pill" style="--ev-color:${bg}">
        ${isImportant ? '<span class="ev-flag-important"></span>' : ''}
        ${timeStr ? `<span class="ev-time">${timeStr}</span>` : ''}
        <span class="ev-title">${escapeHtml(arg.event.title)}</span>
        ${isPrivate ? '<span class="ev-lock">🔒</span>' : ''}
      </div>`
    : `
      <div class="ev-block">
        <div class="ev-block__time">${timeStr}${isImportant ? ' <span class="ev-flag-important"></span>' : ''}</div>
        <div class="ev-block__title">${escapeHtml(arg.event.title)}</div>
        ${isPrivate ? '<div class="ev-block__meta">🔒</div>' : ''}
      </div>`
  return { html }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c
  ))
}

function changeView(newView: CalView) {
  view.value = newView
  const api = calendarRef.value?.getApi()
  if (api) api.changeView(newView)
}

function onSegmentedChange(value: string | number | boolean) {
  changeView(value as CalView)
}

function navPrev() { calendarRef.value?.getApi().prev() }
function navNext() { calendarRef.value?.getApi().next() }
function navToday() { calendarRef.value?.getApi().today() }

function onEventClick(arg: EventClickArg) {
  router.push({ name: 'events.detail', params: { id: arg.event.id } })
}

function onNavToDay(date: Date) {
  view.value = 'timeGridDay'
  const api = calendarRef.value?.getApi()
  if (api) api.changeView('timeGridDay', date)
}

async function onDatesSet(arg: DatesSetArg) {
  currentTitle.value = arg.view.title
  const start = formatDate(arg.start, 'YYYY-MM-DD')
  const end = formatDate(arg.end, 'YYYY-MM-DD')
  await loadEvents(start, end)
}

async function loadEvents(startDate: string, endDate: string) {
  loading.value = true
  try {
    const { data } = await eventsApi.byPeriod({ start_date: startDate, end_date: endDate })
    events.value = data
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

// fcEvents o'zgarganda FullCalendar API orqali yangilanadi (computed options
// ichida BERILMAGAN — aks holda re-render → datesSet → loop)
watch(fcEvents, (newEvents) => {
  const api = calendarRef.value?.getApi()
  if (!api) return
  api.removeAllEvents()
  for (const ev of newEvents) {
    api.addEvent(ev)
  }
}, { deep: true })

onMounted(async () => {
  // Calendar mount bo'lib, datesSet ishga tushgandan keyin events yuklanadi.
  // Initial render uchun nextTick'da fcEvents'ni qo'shamiz (datesSet'dan keyin).
  await nextTick()
  const api = calendarRef.value?.getApi()
  if (api && fcEvents.value.length > 0) {
    for (const ev of fcEvents.value) api.addEvent(ev)
  }

  // Yil view'dagi oy sarlavhalariga click handler — o'sha oyning view'iga o'tkazadi
  setupMonthTitleClick()
})

function setupMonthTitleClick() {
  const calEl = calendarRef.value?.$el as HTMLElement | undefined
  if (!calEl) return
  calEl.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const titleEl = target.closest('.fc-multimonth-title')
    if (!titleEl) return

    // Click qaysi oy ekanligini topish — multimonth ichidagi indeks bo'yicha
    const allTitles = Array.from(calEl.querySelectorAll('.fc-multimonth-title'))
    const idx = allTitles.indexOf(titleEl as Element)
    if (idx < 0) return

    const api = calendarRef.value?.getApi()
    if (!api) return
    // Yil view'da currentStart = Yanvar 1, idx 0..11
    const yearStart = new Date(api.view.currentStart)
    const target_date = new Date(yearStart.getFullYear(), yearStart.getMonth() + idx, 1)
    view.value = 'dayGridMonth'
    api.changeView('dayGridMonth', target_date)
  })
}
</script>

<style lang="scss" scoped>
/* ============================================================
   Tokens — local design variables for consistency
   ============================================================ */
$bg-page: #f5f7fa;
$bg-surface: #ffffff;
$border-soft: #ebeef5;
$border-default: #e4e7ed;
$text-primary: #1f2d3d;
$text-secondary: #5a6c7d;
$text-muted: #909399;
$text-faint: #c0c4cc;
$brand: #409eff;
$brand-soft: rgba(64, 158, 255, 0.08);
$danger: #ee6666;
$radius-card: 12px;
$radius-pill: 8px;
$shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);
$shadow-event-hover: 0 2px 8px rgba(15, 23, 42, 0.08);

/* ============================================================
   Page layout
   ============================================================ */
.calendar-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============================================================
   Toolbar
   ============================================================ */
.cal-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: $bg-surface;
  padding: 14px 20px;
  border-radius: $radius-card;
  box-shadow: $shadow-card;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1 1 auto;
    min-width: 0;
  }

  &__center { flex: 0 0 auto; }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .nav-group { flex-shrink: 0; }

  .today-btn {
    font-weight: 500;
    min-width: 72px;
  }

  .cal-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    text-transform: capitalize;
    line-height: 1.2;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ============================================================
   Stats strip
   ============================================================ */
.stats-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: $bg-surface;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: #fafbfc;
  border: 1px solid $border-default;
  transition: border-color 0.15s ease;

  &__value {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    line-height: 1;
  }

  &__label {
    font-size: 12px;
    color: $text-muted;
    line-height: 1;
  }

  &--important {
    border-color: rgba(238, 102, 102, 0.25);
    background: rgba(238, 102, 102, 0.04);
  }

  &--important .stat__value { color: $danger; }

  &--private {
    border-color: rgba(144, 147, 153, 0.4);
    background: #fafbfc;
  }
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-left: auto;
  padding-left: 16px;
  border-left: 1px solid $border-soft;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $text-secondary;
  white-space: nowrap;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ============================================================
   Calendar surface
   ============================================================ */
.cal-card {
  background: $bg-surface;
  border-radius: $radius-card;
  padding: 16px;
  box-shadow: $shadow-card;
  min-height: 520px;
}

/* ============================================================
   FullCalendar overrides — base
   ============================================================ */
:deep(.fc) {
  font-family: inherit;
  --fc-border-color: #{$border-soft};
  --fc-today-bg-color: rgba(64, 158, 255, 0.05);
  --fc-now-indicator-color: #{$danger};
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #fafbfc;
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: $border-soft;
}

:deep(.fc-scrollgrid),
:deep(.fc-scrollgrid-section > *) {
  border-color: $border-soft;
}

:deep(.fc-scrollgrid) {
  border-radius: 8px;
  overflow: hidden;
}

/* ============================================================
   Column headers (weekday names)
   ============================================================ */
:deep(.fc-col-header-cell) {
  background: #fafbfc;
}

:deep(.fc-col-header-cell-cushion) {
  color: $text-secondary;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-decoration: none;
  padding: 10px 4px;
  display: inline-block;
}

/* ============================================================
   Day cells
   ============================================================ */
:deep(.fc-daygrid-day) {
  transition: background-color 0.15s ease;
}

:deep(.fc-daygrid-day-frame) {
  padding: 2px;
  min-height: 90px;
}

:deep(.fc-daygrid-day-top) {
  flex-direction: row;
  justify-content: flex-end;
}

:deep(.fc-daygrid-day-number) {
  color: $text-primary;
  font-weight: 500;
  font-size: 13px;
  padding: 6px 8px 4px;
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

:deep(.fc-day-other) .fc-daygrid-day-number { color: $text-faint; }

/* Today — bold colored number; cell tint comes from --fc-today-bg-color */
:deep(.fc-day-today .fc-daygrid-day-number) {
  color: $brand;
  font-weight: 700;
}

/* Weekend tint */
:deep(.fc-day-sat),
:deep(.fc-day-sun) {
  background-color: rgba(248, 250, 252, 0.6);
}

/* ============================================================
   Events — month view (pill)
   ============================================================ */
:deep(.fc-event) {
  cursor: pointer;
  border: none;
  background: transparent;
}

:deep(.event-pill) {
  margin: 1px 4px !important;
  background: transparent !important;
  border: none !important;
}

:deep(.fc-daygrid-event) {
  margin-top: 2px !important;
  padding: 0 !important;
}

:deep(.ev-pill) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: $radius-pill;
  background: var(--ev-color, $brand);
  color: #fff;
  font-size: 12px;
  line-height: 1.3;
  overflow: hidden;
  position: relative;
  transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

:deep(.ev-pill:hover) {
  filter: brightness(1.06);
  box-shadow: $shadow-event-hover;
  transform: translateY(-1px);
}

:deep(.ev-pill .ev-time) {
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  opacity: 0.92;
  flex-shrink: 0;
}

:deep(.ev-pill .ev-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  font-weight: 500;
}

:deep(.ev-pill .ev-lock) {
  font-size: 10px;
  opacity: 0.85;
  flex-shrink: 0;
}

:deep(.ev-pill .ev-flag-important) {
  width: 3px;
  align-self: stretch;
  background: #fde047;
  border-radius: 1.5px;
  flex-shrink: 0;
}

/* ============================================================
   Events — time grid (block)
   ============================================================ */
:deep(.fc-timegrid-event-harness) { margin: 0 2px; }

:deep(.fc-timegrid-event) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: $radius-pill;
}

:deep(.fc-timegrid-event .fc-event-main) {
  padding: 0 !important;
}

:deep(.ev-block) {
  height: 100%;
  padding: 5px 8px 4px;
  border-radius: $radius-pill;
  background: var(--ev-color, $brand);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  border-left: 3px solid rgba(0, 0, 0, 0.22);
  transition: filter 0.15s ease;
}

:deep(.ev-block:hover) { filter: brightness(1.06); }

:deep(.ev-block__time) {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  opacity: 0.95;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.ev-block__title) {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* ============================================================
   Important event accent
   ============================================================ */
:deep(.fc-event.is-important .ev-pill) {
  box-shadow: 0 0 0 2px #fde047, 0 1px 3px rgba(0, 0, 0, 0.08);
}

:deep(.fc-event.is-important .ev-block) {
  border-top: 3px solid #fde047;
  padding-top: 3px;
}

/* ============================================================
   Time grid — slots & axis
   ============================================================ */
:deep(.fc-timegrid-slot) { height: 38px; }

:deep(.fc-timegrid-slot-minor) {
  border-top-style: dotted;
  border-top-color: #f2f4f7;
}

:deep(.fc-timegrid-slot-label) { border-color: transparent; }

:deep(.fc-timegrid-slot-label-cushion) {
  font-size: 11px;
  color: $text-muted;
  font-variant-numeric: tabular-nums;
  padding: 0 8px;
}

:deep(.fc-timegrid-axis) {
  border-color: $border-soft;
}

:deep(.fc-non-business) {
  background: rgba(244, 246, 251, 0.55);
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: $danger;
  border-width: 1.5px;
  border-style: solid;
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-color: $danger;
  border-width: 5px;
}

/* ============================================================
   Multi-month (year view)
   ============================================================ */
:deep(.fc-multimonth) {
  border: none;
  width: 100%;
}

:deep(.fc-multimonth-month) {
  padding: 12px 16px 16px;
  border: 1px solid $border-soft;
  border-radius: 10px;
  background: #fff;
  /* Margin yo'q — table chegaralar bilan to'g'ri taqsimlanadi */
}

:deep(.fc-multimonth-title) {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  text-transform: capitalize;
  padding: 6px 12px;
  margin: 0 auto 8px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.12s ease, color 0.12s ease;
  display: inline-block;

  &:hover {
    background: rgba(64, 158, 255, 0.08);
    color: $brand;
  }
}

:deep(.fc-multimonth-daygrid-table) {
  font-size: 13px;
  width: 100%;
  table-layout: fixed;
}

:deep(.fc-multimonth-daygrid-table td) {
  height: 36px;
  vertical-align: top;
}

:deep(.fc-multimonth-daygrid-day-number) {
  font-size: 12px;
  padding: 4px 6px;
}

:deep(.fc-multimonth-daygrid-table th) {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: $text-muted;
  font-weight: 500;
  padding: 6px 0;
}

/* ============================================================
   "+N more" link
   ============================================================ */
:deep(.fc-daygrid-more-link) {
  color: $brand;
  font-weight: 500;
  font-size: 11px;
  background: $brand-soft;
  padding: 2px 8px;
  border-radius: 6px;
  margin: 2px 4px;
  display: inline-block;
  transition: background-color 0.15s ease;
}

:deep(.fc-daygrid-more-link:hover) {
  background: rgba(64, 158, 255, 0.16);
  text-decoration: none;
}

:deep(.fc-popover) {
  border: 1px solid $border-soft !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
  overflow: hidden;
}

:deep(.fc-popover-header) {
  background: #fafbfc !important;
  padding: 8px 12px !important;
  border-bottom: 1px solid $border-soft !important;
}

:deep(.fc-popover-title) {
  font-weight: 600;
  font-size: 13px;
  color: $text-primary;
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 1024px) {
  .legend { display: none; }
  .cal-toolbar { gap: 12px; padding: 12px 14px; }
  .cal-toolbar .cal-title { font-size: 17px; }
}

@media (max-width: 720px) {
  .cal-toolbar__left { width: 100%; }
  .cal-toolbar__center { width: 100%; }
  .stats-strip .stat__label { display: none; }

  :deep(.fc-daygrid-day-frame) { min-height: 64px; }
  :deep(.ev-pill) { padding: 2px 6px; font-size: 11px; }
  :deep(.ev-pill .ev-time) { display: none; }
}
</style>
