<template>
  <div class="dashboard">
    <OnBehalfBanner />

    <!-- ===== HERO ===== -->
    <section class="hero">
      <div class="hero__bg" aria-hidden="true"></div>
      <div class="hero__content">
        <div class="hero__left">
          <div class="hero__date">{{ todayLabel }}</div>
          <h1 class="hero__greeting">{{ $t('dashboard.greeting') }}, {{ heroName }}!</h1>
          <div v-if="positionLabel" class="hero__position">{{ positionLabel }}</div>
          <div class="hero__summary">
            <el-icon><Clock /></el-icon>
            <span v-if="todayEvents.length">
              {{ $t('dashboard.todaySummary', { n: todayEvents.length }) }}
            </span>
            <span v-else>{{ $t('dashboard.todaySummaryEmpty') }}</span>
          </div>
        </div>
        <div class="hero__actions">
          <el-button
            v-if="canCreateEvent"
            class="hero__btn hero__btn--solid"
            size="large"
            @click="router.push({ name: 'events.create' })"
          >
            <el-icon><Plus /></el-icon>&nbsp;{{ $t('dashboard.quickEvent') }}
          </el-button>
          <el-button
            class="hero__btn"
            size="large"
            @click="announcementDialogOpen = true"
          >
            <el-icon><Promotion /></el-icon>&nbsp;{{ $t('dashboard.quickAnnouncement') }}
          </el-button>
          <el-button
            class="hero__btn"
            size="large"
            @click="router.push({ name: 'calendar' })"
          >
            <el-icon><Calendar /></el-icon>&nbsp;{{ $t('dashboard.openCalendar') }}
          </el-button>
        </div>
      </div>
    </section>

    <!-- ===== KPI CARDS ===== -->
    <div class="kpis">
      <button
        v-for="k in kpis"
        :key="k.key"
        class="kpi"
        :class="{ 'kpi--link': !!k.route }"
        type="button"
        @click="k.route && router.push({ name: k.route })"
      >
        <span class="kpi__icon" :style="{ background: k.soft, color: k.color }">
          <el-icon :size="22"><component :is="k.icon" /></el-icon>
        </span>
        <span class="kpi__body">
          <span class="kpi__value">{{ k.value }}</span>
          <span class="kpi__label">{{ k.label }}</span>
        </span>
      </button>
    </div>

    <!-- ===== MAIN GRID ===== -->
    <el-row :gutter="16" class="grid">
      <!-- LEFT: today's agenda + upcoming -->
      <el-col :xs="24" :lg="15">
        <!-- Bugungi reja -->
        <div class="panel" v-loading="loadingEvents">
          <div class="panel__head">
            <h2 class="panel__title">
              <el-icon class="panel__title-icon"><Clock /></el-icon>
              {{ $t('dashboard.todaySchedule') }}
            </h2>
            <el-button link type="primary" @click="router.push({ name: 'calendar' })">
              {{ $t('dashboard.viewAll') }}<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div v-if="todayEvents.length === 0" class="empty">
            <el-icon :size="34" class="empty__icon"><Coffee /></el-icon>
            <p>{{ $t('dashboard.noEventsToday') }}</p>
          </div>

          <ul v-else class="agenda">
            <li
              v-for="e in todayEvents"
              :key="e.id"
              class="agenda__item"
              @click="router.push({ name: 'events.detail', params: { id: e.id } })"
            >
              <div class="agenda__time">
                <span class="agenda__start">{{ e.start_time.slice(0, 5) }}</span>
                <span class="agenda__end">{{ e.end_time.slice(0, 5) }}</span>
              </div>
              <span class="agenda__bar" :class="{ 'agenda__bar--imp': e.is_important }"></span>
              <div class="agenda__main">
                <div class="agenda__title">
                  {{ e.title }}
                  <el-tag v-if="e.is_important" type="danger" size="small" effect="light">
                    {{ $t('event.important') }}
                  </el-tag>
                </div>
                <div class="agenda__meta">
                  <span v-if="e.address"><el-icon><Location /></el-icon> {{ e.address }}</span>
                  <span v-if="typeLabel(e)"><el-icon><CollectionTag /></el-icon> {{ typeLabel(e) }}</span>
                  <span v-if="e.speaker"><el-icon><User /></el-icon> {{ formatUser(e.speaker) }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Yaqin kunlardagi tadbirlar -->
        <div class="panel" v-loading="loadingEvents">
          <div class="panel__head">
            <h2 class="panel__title">
              <el-icon class="panel__title-icon"><Calendar /></el-icon>
              {{ $t('dashboard.upcomingEvents') }}
            </h2>
          </div>

          <div v-if="upcomingEvents.length === 0" class="empty empty--sm">
            <p>{{ $t('dashboard.noUpcoming') }}</p>
          </div>

          <ul v-else class="upcoming">
            <li
              v-for="e in upcomingEvents"
              :key="e.id"
              class="upcoming__item"
              @click="router.push({ name: 'events.detail', params: { id: e.id } })"
            >
              <div class="upcoming__date">
                <span class="upcoming__day">{{ dayNum(e.date) }}</span>
                <span class="upcoming__mon">{{ monShort(e.date) }}</span>
              </div>
              <div class="upcoming__main">
                <div class="upcoming__title">{{ e.title }}</div>
                <div class="upcoming__meta">
                  <el-icon><Clock /></el-icon> {{ e.start_time.slice(0, 5) }}
                  <template v-if="e.address">· <el-icon><Location /></el-icon> {{ e.address }}</template>
                </div>
              </div>
              <el-icon class="upcoming__arrow"><ArrowRight /></el-icon>
            </li>
          </ul>
        </div>
      </el-col>

      <!-- RIGHT: announcements + deputies -->
      <el-col :xs="24" :lg="9">
        <!-- So'nggi e'lonlar -->
        <div class="panel" v-loading="loadingAnnouncements">
          <div class="panel__head">
            <h2 class="panel__title">
              <el-icon class="panel__title-icon"><Promotion /></el-icon>
              {{ $t('dashboard.recentAnnouncements') }}
            </h2>
          </div>

          <div v-if="announcements.length === 0" class="empty empty--sm">
            <p>{{ $t('dashboard.noAnnouncements') }}</p>
          </div>

          <ul v-else class="ann-list">
            <li
              v-for="a in announcements"
              :key="a.id"
              class="ann-list__item"
              @click="router.push({ name: 'announcements.detail', params: { id: a.id } })"
            >
              <el-avatar :size="36" :src="a.sender?.avatar_url || undefined">
                {{ initials(a.sender) }}
              </el-avatar>
              <div class="ann-list__main">
                <div class="ann-list__top">
                  <span class="ann-list__sender">{{ formatUser(a.sender) }}</span>
                  <span class="ann-list__time">{{ fromNow(a.created_at) }}</span>
                </div>
                <div class="ann-list__text">{{ a.description }}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- O'rinbosarlar -->
        <div v-if="showDeputies" class="panel" v-loading="loadingDeputies">
          <div class="panel__head">
            <h2 class="panel__title">
              <el-icon class="panel__title-icon"><UserFilled /></el-icon>
              {{ $t('dashboard.deputies') }}
            </h2>
          </div>

          <div v-if="deputies.length === 0" class="empty empty--sm">
            <p>{{ $t('dashboard.noDeputies') }}</p>
          </div>

          <ul v-else class="deputies">
            <li v-for="d in deputies" :key="d.id" class="deputies__item">
              <el-avatar :size="40" :src="d.avatar_url || undefined">
                {{ initials(d) }}
              </el-avatar>
              <div class="deputies__main">
                <div class="deputies__name">{{ formatUser(d) }}</div>
                <div v-if="posLabel(d)" class="deputies__pos">{{ posLabel(d) }}</div>
              </div>
              <span class="deputies__status" :style="{ color: statusColor(d.status), background: statusSoft(d.status) }">
                {{ statusLabel(d.status) }}
              </span>
            </li>
          </ul>
        </div>
      </el-col>
    </el-row>

    <!-- E'lon yaratish dialogi -->
    <AnnouncementDialog v-model="announcementDialogOpen" @created="loadAnnouncements" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import {
  ArrowRight, Calendar, Clock, Coffee, CollectionTag, Location, Plus,
  Promotion, ChatDotRound, Bell, TrendCharts, User, UserFilled,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationsStore } from '@/stores/notifications'
import { useLookupStore } from '@/stores/lookup'
import { useRealtimeStore } from '@/stores/realtime'
import { eventsApi } from '@/api/events'
import { reportsApi } from '@/api/reports'
import { usersApi } from '@/api/users'
import { fullName } from '@/utils/format'
import { fromNow } from '@/utils/date'
import type { Event } from '@/types/event'
import type { Report } from '@/types/report'
import type { User as TUser } from '@/types/user'
import AnnouncementDialog from '@/components/report/AnnouncementDialog.vue'
import OnBehalfBanner from '@/components/common/OnBehalfBanner.vue'

const router = useRouter()
const { t, locale } = useI18n()
const auth = useAuthStore()
const chat = useChatStore()
const notifications = useNotificationsStore()
const lookup = useLookupStore()
const realtime = useRealtimeStore()

// ---- holat ----
const loadingEvents = ref(false)
const loadingAnnouncements = ref(false)
const loadingDeputies = ref(false)

const todayEvents = ref<Event[]>([])
const upcomingEvents = ref<Event[]>([])
const weekCount = ref(0)
const monthCount = ref(0)

const announcements = ref<Report[]>([])
const announcementCount = ref(0)
const deputies = ref<TUser[]>([])

const announcementDialogOpen = ref(false)

// ---- foydalanuvchi ----
const heroName = computed(() => {
  const u = auth.user
  if (!u) return ''
  return [u.last_name, u.first_name].filter(Boolean).join(' ')
})

const positionLabel = computed(() => {
  const u = auth.user
  if (!u) return ''
  return locale.value === 'ru' ? u.position_ru || '' : u.position_uz || ''
})

const canCreateEvent = computed(() => auth.hasRole('VAZIR', 'ORINBOSAR', 'YORDAMCHI', 'BOSHLIQ'))
const showDeputies = computed(() => auth.hasRole('VAZIR', 'ORINBOSAR', 'SUPER_ADMIN', 'ADMIN'))

// ---- sana (mahalliylashtirilgan, kafolatlangan) ----
const WEEKDAYS: Record<string, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  uz_Cyrl: ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
}
const MONTHS: Record<string, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  uz_Cyrl: ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентабр', 'октабр', 'ноябр', 'декабр'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
}
const MON_SHORT: Record<string, string[]> = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  uz_Cyrl: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
}
function locKey(): 'uz' | 'uz_Cyrl' | 'ru' {
  const l = locale.value
  if (l.startsWith('ru')) return 'ru'
  if (l.toLowerCase().includes('cyrl')) return 'uz_Cyrl'
  return 'uz'
}

const todayLabel = computed(() => {
  const k = locKey()
  const d = dayjs()
  return `${WEEKDAYS[k][d.day()]}, ${d.date()}-${MONTHS[k][d.month()]} ${d.year()}`
})

function dayNum(date: string): string {
  return dayjs(date).format('D')
}
function monShort(date: string): string {
  return MON_SHORT[locKey()][dayjs(date).month()]
}

// ---- KPI ----
const kpis = computed(() => [
  { key: 'today', label: t('dashboard.todayEvents'), value: todayEvents.value.length, icon: Clock, color: '#1a73e8', soft: '#e8f0fe', route: 'calendar' },
  { key: 'week', label: t('dashboard.weekEvents'), value: weekCount.value, icon: Calendar, color: '#1e8e3e', soft: '#e6f4ea', route: 'calendar' },
  { key: 'month', label: t('dashboard.monthEvents'), value: monthCount.value, icon: TrendCharts, color: '#7c4dff', soft: '#efeaff', route: 'calendar' },
  { key: 'ann', label: t('dashboard.announcements'), value: announcementCount.value, icon: Promotion, color: '#f9ab00', soft: '#fef7e0', route: '' },
  { key: 'chat', label: t('dashboard.unreadChat'), value: chat.unreadCount, icon: ChatDotRound, color: '#00acc1', soft: '#e0f7fa', route: '' },
  { key: 'notif', label: t('dashboard.notifications'), value: notifications.unreadCount, icon: Bell, color: '#d93025', soft: '#fce8e6', route: '' },
])

// ---- helperlar ----
function formatUser(u?: TUser | null): string {
  return u ? fullName(u) : '—'
}
function initials(u?: TUser | null): string {
  if (!u) return ''
  return `${u.last_name?.[0] || ''}${u.first_name?.[0] || ''}`.toUpperCase()
}
function typeLabel(e: Event): string {
  return lookup.types.find((x) => x.value === e.type)?.label || ''
}
function posLabel(u: TUser): string {
  return locale.value === 'ru' ? u.position_ru || '' : u.position_uz || ''
}

const STATUS_COLOR: Record<string, string> = {
  AT_WORK: '#1e8e3e',
  ON_HOLIDAY: '#f9ab00',
  WORK_TRIP: '#1a73e8',
  IN_CHILDHOOD_RAISING: '#7c4dff',
  DISMISSED: '#5f6368',
}
const STATUS_SOFT: Record<string, string> = {
  AT_WORK: '#e6f4ea',
  ON_HOLIDAY: '#fef7e0',
  WORK_TRIP: '#e8f0fe',
  IN_CHILDHOOD_RAISING: '#efeaff',
  DISMISSED: '#f1f3f4',
}
function statusColor(s: string): string {
  return STATUS_COLOR[s] || '#5f6368'
}
function statusSoft(s: string): string {
  return STATUS_SOFT[s] || '#f1f3f4'
}
function statusLabel(s: string): string {
  return lookup.statuses.find((x) => x.value === s)?.label || s
}

// ---- yuklash ----
async function loadEvents() {
  loadingEvents.value = true
  try {
    const now = dayjs()
    const startMonth = now.startOf('month')
    const endMonth = now.endOf('month')
    const dow = now.day()
    const startWeek = now.subtract((dow + 6) % 7, 'day').startOf('day')
    const endWeek = startWeek.add(6, 'day').endOf('day')
    const rangeStart = startWeek.isBefore(startMonth) ? startWeek : startMonth
    const rangeEnd = endWeek.isAfter(endMonth) ? endWeek : endMonth

    const { data } = await eventsApi.byPeriod({
      start_date: rangeStart.format('YYYY-MM-DD'),
      end_date: rangeEnd.format('YYYY-MM-DD'),
    })

    const todayStr = now.format('YYYY-MM-DD')
    const sW = startWeek.format('YYYY-MM-DD')
    const eW = endWeek.format('YYYY-MM-DD')
    const sM = startMonth.format('YYYY-MM-DD')
    const eM = endMonth.format('YYYY-MM-DD')

    todayEvents.value = data
      .filter((e) => e.date === todayStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    weekCount.value = data.filter((e) => e.date >= sW && e.date <= eW).length
    monthCount.value = data.filter((e) => e.date >= sM && e.date <= eM).length
    upcomingEvents.value = data
      .filter((e) => e.date > todayStr)
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
      .slice(0, 5)
  } catch (_e) {
    /* dashboard ochiq qolsin */
  } finally {
    loadingEvents.value = false
  }
}

async function loadAnnouncements() {
  loadingAnnouncements.value = true
  try {
    const { data } = await reportsApi.announcements({ page: 1, page_size: 5 })
    announcements.value = data.results
  } catch (_e) {
    /* ignore */
  }
  try {
    const { data } = await reportsApi.announcementsCount()
    announcementCount.value = data.count
  } catch (_e) {
    /* ignore */
  } finally {
    loadingAnnouncements.value = false
  }
}

async function loadDeputies() {
  if (!showDeputies.value) return
  loadingDeputies.value = true
  try {
    const { data } = await usersApi.vice()
    deputies.value = data
  } catch (_e) {
    /* ignore */
  } finally {
    loadingDeputies.value = false
  }
}

// Realtime — tadbir/e'lon o'zgarsa dashboard jonli yangilanadi
watch(() => realtime.eventsBump, loadEvents)
watch(() => realtime.announcementsBump, loadAnnouncements)

onMounted(() => {
  lookup.loadAll().catch(() => undefined)
  loadEvents()
  loadAnnouncements()
  loadDeputies()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============ HERO ============ */
.hero {
  position: relative;
  border-radius: $radius-lg;
  overflow: hidden;
  color: #fff;
  padding: 28px 32px;
  box-shadow: $shadow-1;

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a73e8 0%, #1557b0 60%, #6a3fd1 130%);

    &::after {
      content: '';
      position: absolute;
      top: -60px;
      right: -40px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &__content {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  &__date {
    font-size: 13px;
    opacity: 0.85;
    text-transform: capitalize;
    margin-bottom: 6px;
  }

  &__greeting {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.2;
    color: #fff; // global `h1 { color }` qoidasini bekor qilamiz (aks holda to'q chiqadi)
  }

  &__position {
    margin-top: 6px;
    font-size: 14px;
    opacity: 0.9;
  }

  &__summary {
    margin-top: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.16);
    padding: 7px 14px;
    border-radius: $radius-pill;
    backdrop-filter: blur(4px);
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__btn {
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.12);
    color: #fff;

    &:hover,
    &:focus {
      background: rgba(255, 255, 255, 0.22);
      border-color: #fff;
      color: #fff;
    }

    &--solid {
      background: #fff;
      color: $color-primary-dark;
      border-color: #fff;

      &:hover,
      &:focus {
        background: #f1f3f4;
        color: $color-primary-dark;
      }
    }
  }
}

/* ============ KPI ============ */
.kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid $color-border-soft;
  border-radius: $radius-md;
  text-align: left;
  cursor: default;
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;

  &--link {
    cursor: pointer;
  }

  &--link:hover {
    box-shadow: $shadow-elevated;
    transform: translateY(-2px);
    border-color: $color-border;
  }

  &__icon {
    width: 46px;
    height: 46px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: $color-text;
    line-height: 1.1;
  }

  &__label {
    font-size: 12px;
    color: $color-text-muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* ============ PANEL ============ */
.panel {
  background: #fff;
  border: 1px solid $color-border-soft;
  border-radius: $radius-md;
  padding: 16px 18px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $color-text;
  }

  &__title-icon {
    color: $color-primary;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  color: $color-text-muted;
  font-size: 13px;
  text-align: center;

  &__icon {
    color: $color-border;
  }

  &--sm {
    padding: 18px 16px;
  }

  p {
    margin: 0;
  }
}

/* ===== Agenda (bugungi reja) ===== */
.agenda {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: stretch;
    gap: 12px;
    padding: 10px 8px;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background 0.12s ease;

    &:hover {
      background: $color-bg-soft;
    }
  }

  &__time {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 48px;
  }

  &__start {
    font-size: 15px;
    font-weight: 700;
    color: $color-text;
  }

  &__end {
    font-size: 12px;
    color: $color-text-disabled;
  }

  &__bar {
    width: 4px;
    border-radius: 2px;
    background: $color-primary;
    flex-shrink: 0;

    &--imp {
      background: $color-accent-red;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $color-text;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__meta {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: $color-text-muted;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}

/* ===== Upcoming ===== */
.upcoming {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 8px;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background 0.12s ease;

    &:hover {
      background: $color-bg-soft;

      .upcoming__arrow {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }

  &__date {
    width: 48px;
    height: 48px;
    border-radius: $radius-sm;
    background: $color-primary-soft;
    color: $color-primary-dark;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__day {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
  }

  &__mon {
    font-size: 11px;
    text-transform: uppercase;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    margin-top: 2px;
    font-size: 12px;
    color: $color-text-muted;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__arrow {
    color: $color-text-disabled;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.15s ease;
  }
}

/* ===== Announcements ===== */
.ann-list {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    gap: 10px;
    padding: 10px 6px;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background 0.12s ease;

    &:hover {
      background: $color-bg-soft;
    }

    & + & {
      border-top: 1px solid $color-border-soft;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__sender {
    font-size: 13px;
    font-weight: 600;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    font-size: 11px;
    color: $color-text-disabled;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__text {
    margin-top: 2px;
    font-size: 13px;
    color: $color-text-muted;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ===== Deputies ===== */
.deputies {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;

    & + & {
      border-top: 1px solid $color-border-soft;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__pos {
    font-size: 12px;
    color: $color-text-muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: $radius-pill;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* ============ Responsive ============ */
@media (max-width: #{$bp-xl - 1px}) {
  .kpis {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include mobile {
  .hero {
    padding: 20px;

    &__greeting {
      font-size: 21px;
    }

    &__actions {
      width: 100%;
    }

    &__btn {
      flex: 1;
    }
  }

  .kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
