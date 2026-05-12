import type { AxiosRequestConfig } from 'axios'
import apiClient from './client'
import type { User, Role } from '@/types/user'

export interface AdminUserCreatePayload {
  username: string
  first_name: string
  last_name: string
  father_name?: string
  position_uz: string
  position_ru: string
  phone_number: string
  email?: string
  password: string
  role_id: number
  direction_id: string
  chief_id?: string | null
  status: 'AT_WORK' | 'ON_HOLIDAY' | 'WORK_TRIP' | 'DISMISSED' | 'IN_CHILDHOOD_RAISING'
  enabled: boolean
}

export type AdminUserUpdatePayload = Partial<Omit<AdminUserCreatePayload, 'password'>>

export interface AdminUserPage {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  role?: number
  direction?: string
  enabled?: boolean
  status?: string
  ordering?: string
}

export interface Direction {
  id: string
  name_uz: string
  name_ru: string
  organisation_id: string
  parent_id: string | null
  children?: Direction[]
}

export interface DirectionPayload {
  name_uz: string
  name_ru: string
  organisation_id: string
  parent_id?: string | null
}

export interface Organisation {
  id: string
  name_uz: string
  name_ru: string
  address_uz: string
  address_ru: string
  phone_number: string
  district_id: number
  parent_id: string | null
  lat?: number | null
  lng?: number | null
  children?: Organisation[]
}

export interface OrganisationPayload {
  name_uz: string
  name_ru: string
  address_uz: string
  address_ru: string
  phone_number: string
  district_id: number
  parent_id?: string | null
  lat?: number | null
  lng?: number | null
}

export interface Region {
  id: number
  name_uz: string
  name_ru: string
}

export interface District {
  id: number
  name_uz: string
  name_ru: string
  region_id: number
}

export const adminUsersApi = {
  list(params?: UserListParams) {
    return apiClient.get<AdminUserPage>('/users/', { params })
  },
  retrieve(id: string) {
    return apiClient.get<User>(`/users/${id}/`)
  },
  create(payload: AdminUserCreatePayload) {
    return apiClient.post<User>('/users/', payload)
  },
  update(id: string, payload: AdminUserUpdatePayload | FormData) {
    // FormData uchun Content-Type'ni qo'lda o'rnatmaymiz — browser boundary bilan
    // avtomatik qo'yadi (aks holda fayllar parse bo'lmaydi).
    return apiClient.put<User>(`/users/${id}/`, payload)
  },
  patch(id: string, payload: Partial<AdminUserUpdatePayload>) {
    return apiClient.patch<User>(`/users/${id}/`, payload)
  },
  delete(id: string, config?: AxiosRequestConfig) {
    return apiClient.delete(`/users/${id}/`, config)
  },
  changeStatus(id: string, status: string) {
    return apiClient.patch(`/users/${id}/status/`, { status })
  },
  resetPassword(id: string, new_password?: string) {
    return apiClient.post<{ success: boolean; generated_password?: string }>(
      `/users/${id}/reset-password/`,
      new_password ? { new_password } : {}
    )
  },
  clearTelegram(id: string) {
    return apiClient.post(`/users/${id}/clear-telegram/`)
  },
  roles() {
    return apiClient.get<Role[]>('/info/roles-full/')
  },
}

export interface DirectionPage {
  count: number
  next: string | null
  previous: string | null
  results: Direction[]
}

export const adminDirectionsApi = {
  list(params?: { parent_id?: string; search?: string; page?: number; page_size?: number }) {
    return apiClient.get<DirectionPage>('/directions/', { params })
  },
  tree() {
    return apiClient.get<Direction[]>('/directions/tree/')
  },
  retrieve(id: string) {
    return apiClient.get<Direction>(`/directions/${id}/`)
  },
  create(payload: DirectionPayload) {
    return apiClient.post<Direction>('/directions/', payload)
  },
  update(id: string, payload: DirectionPayload) {
    return apiClient.put<Direction>(`/directions/${id}/`, payload)
  },
  delete(id: string) {
    return apiClient.delete(`/directions/${id}/`)
  },
}

export const adminOrganisationsApi = {
  list(params?: { search?: string; page?: number; page_size?: number }) {
    return apiClient.get<{ results: Organisation[] }>('/organisations/', { params })
  },
  tree() {
    return apiClient.get<Organisation[]>('/organisations/tree/')
  },
  retrieve(id: string) {
    return apiClient.get<Organisation>(`/organisations/${id}/`)
  },
  create(payload: OrganisationPayload) {
    return apiClient.post<Organisation>('/organisations/', payload)
  },
  update(id: string, payload: OrganisationPayload) {
    return apiClient.put<Organisation>(`/organisations/${id}/`, payload)
  },
  delete(id: string) {
    return apiClient.delete(`/organisations/${id}/`)
  },
}

export const adminRegionsApi = {
  list() {
    return apiClient.get<Region[]>('/regions/')
  },
  create(payload: { name_uz: string; name_ru: string }) {
    return apiClient.post<Region>('/regions/', payload)
  },
  update(id: number, payload: { name_uz: string; name_ru: string }) {
    return apiClient.put<Region>(`/regions/${id}/`, payload)
  },
  delete(id: number) {
    return apiClient.delete(`/regions/${id}/`)
  },
  districts(region_id?: number) {
    return apiClient.get<District[]>('/districts/', { params: { region_id } })
  },
  createDistrict(payload: { name_uz: string; name_ru: string; region_id: number }) {
    return apiClient.post<District>('/districts/', payload)
  },
  updateDistrict(id: number, payload: { name_uz: string; name_ru: string; region_id: number }) {
    return apiClient.put<District>(`/districts/${id}/`, payload)
  },
  deleteDistrict(id: number) {
    return apiClient.delete(`/districts/${id}/`)
  },
}
