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
    path: '/calendar/week',
    name: 'calendar.week',
    component: () => import('@/views/calendar/WeekView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.calendarWeek' },
  },
  {
    path: '/calendar/month',
    name: 'calendar.month',
    component: () => import('@/views/calendar/MonthView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.calendarMonth' },
  },
  {
    path: '/calendar/vice/:id',
    name: 'calendar.vice',
    component: () => import('@/views/calendar/ViceCalendarView.vue'),
    meta: { requiresAuth: true, roles: ['PREMIER_MINISTER'] },
  },
  {
    path: '/events/new',
    name: 'events.create',
    component: () => import('@/views/events/EventCreateView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['PREMIER_MINISTER', 'VICE_MINISTER', 'ASSISTANT_PREMIER', 'HEAD', 'ASSISTANT'],
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
  {
    path: '/pre-events',
    name: 'preEvents.list',
    component: () => import('@/views/pre-events/PreEventListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/tasks',
    name: 'reports.tasks',
    component: () => import('@/views/reports/TaskListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/requests',
    name: 'reports.requests',
    component: () => import('@/views/reports/RequestListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'chat.list',
    component: () => import('@/views/chat/ChatListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat/:userId',
    name: 'chat.room',
    component: () => import('@/views/chat/ChatRoomView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/notifications/NotificationListView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.notifications' },
  },
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
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: true },
  },
]
