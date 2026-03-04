import { apiClient } from './client'
import type { Project } from '../types/project'

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects')
    return response.data
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`)
    return response.data
  },
}
