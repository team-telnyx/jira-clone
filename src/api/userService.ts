import { apiClient } from './client'
import type { User } from '../types/issue'

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`)
    return response.data
  },
}
