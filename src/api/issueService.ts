import { apiClient } from './client'
import type { Issue, CreateIssuePayload, UpdateIssuePayload } from '../types/issue'

export const issueService = {
  async getAll(): Promise<Issue[]> {
    const response = await apiClient.get<Issue[]>('/issues')
    return response.data
  },

  async getById(id: string): Promise<Issue> {
    const response = await apiClient.get<Issue>(`/issues/${id}`)
    return response.data
  },

  async create(payload: CreateIssuePayload): Promise<Issue> {
    const response = await apiClient.post<Issue>('/issues', payload)
    return response.data
  },

  async update(id: string, payload: Partial<UpdateIssuePayload>): Promise<Issue> {
    const response = await apiClient.patch<Issue>(`/issues/${id}`, payload)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/issues/${id}`)
  },
}
