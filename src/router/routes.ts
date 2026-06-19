import type { RouteRecordRaw } from 'vue-router'
import type { RoleName } from '@/types/user'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    layout?: 'auth' | 'default'
    roles?: RoleName[]
    titleKey?: string
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', titleKey: 'auth.login' },
  },
  {
    path: '/',
    redirect: '/dashboard',
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.dashboard' },
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/calendar/CalendarView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.calendar' },
  },
  {
    path: '/events/new',
    name: 'events.create',
    component: () => import('@/views/events/EventCreateView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['VAZIR', 'ORINBOSAR', 'YORDAMCHI', 'BOSHLIQ'],
    },
  },
  {
    path: '/events/:id',
    name: 'events.detail',
    component: () => import('@/views/events/EventDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events/:id/edit',
    name: 'events.edit',
    component: () => import('@/views/events/EventEditView.vue'),
    meta: { requiresAuth: true },
  },
  // Umumiy e'lon — alohida sahifa (qo'ng'iroqcha/e'lonlar ro'yxatidan ochiladi)
  {
    path: '/announcements/:id',
    name: 'announcements.detail',
    component: () => import('@/views/announcements/AnnouncementDetailView.vue'),
    meta: { requiresAuth: true },
  },
  // AI Drafts (Telegram orqali ovozdan yaratilgan qoralamalar)
  {
    path: '/drafts',
    name: 'drafts.list',
    component: () => import('@/views/drafts/DraftsListView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.drafts' },
  },
  {
    path: '/drafts/event/:id',
    name: 'drafts.event.edit',
    component: () => import('@/views/drafts/EventDraftEditView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/drafts/report/:id',
    name: 'drafts.report.edit',
    component: () => import('@/views/drafts/ReportDraftEditView.vue'),
    meta: { requiresAuth: true },
  },

  // Chat / Topshiriq / So'rov / Bildirishnoma — alohida sahifa sifatida ochilmaydi.
  // Hammasi RightPanel ichida ko'rinadi (production'dagidek).
  // Web Push sozlamalari faqat admin/foydalanuvchi sozlash uchun saqlanadi:
  {
    path: '/notifications/settings',
    name: 'notifications.settings',
    component: () => import('@/views/notifications/WebPushSettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    name: 'profile.edit',
    component: () => import('@/views/profile/ProfileEditView.vue'),
    meta: { requiresAuth: true },
  },

  // Admin (rol guard)
  {
    path: '/admin',
    name: 'admin.dashboard',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.dashboard' },
  },
  {
    path: '/admin/users',
    name: 'admin.users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.users' },
  },
  {
    path: '/admin/users/new',
    name: 'admin.users.create',
    component: () => import('@/views/admin/UserCreateView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'] },
  },
  {
    path: '/admin/users/:id',
    name: 'admin.users.detail',
    component: () => import('@/views/admin/UserDetailView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'] },
  },
  {
    path: '/admin/users/:id/edit',
    name: 'admin.users.edit',
    component: () => import('@/views/admin/UserEditView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'] },
  },
  {
    path: '/admin/directions',
    name: 'admin.directions',
    component: () => import('@/views/admin/DirectionsView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.directions' },
  },
  {
    path: '/admin/organisations',
    name: 'admin.organisations',
    component: () => import('@/views/admin/OrganisationsView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.organisations' },
  },
  {
    path: '/admin/regions',
    name: 'admin.regions',
    component: () => import('@/views/admin/RegionsView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.regions' },
  },
  {
    path: '/admin/halls',
    name: 'admin.halls',
    component: () => import('@/views/admin/HallsView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'ADMIN'], titleKey: 'admin.halls' },
  },
  {
    path: '/admin/chats',
    name: 'admin.chats',
    component: () => import('@/views/admin/AdminChatsView.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'], titleKey: 'admin.chats' },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: true },
  },
]
