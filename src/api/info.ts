import apiClient from './client'

export interface Choice {
  value: string
  label: string
  color?: string
}

export const infoApi = {
  spheres() {
    return apiClient.get<Choice[]>('/info/spheres/')
  },
  types() {
    return apiClient.get<Choice[]>('/info/types/')
  },
  taskReplies() {
    return apiClient.get<Choice[]>('/info/task-replies/')
  },
  requestReplies() {
    return apiClient.get<Choice[]>('/info/request-replies/')
  },
  roles() {
    return apiClient.get<Choice[]>('/info/roles/')
  },
  statuses() {
    return apiClient.get<Choice[]>('/info/statuses/')
  },
  regions() {
    return apiClient.get<{ id: number; name: string }[]>('/info/regions/')
  },
  districts(region_id: number) {
    return apiClient.get<{ id: number; name: string }[]>('/info/districts/', { params: { region_id } })
  },
}
