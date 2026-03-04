import { mock } from 'bun:test'
import type { User } from '../../types/issue'

export const mockUsers: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
]

export const createMockUserService = () => ({
  getAll: mock(() => Promise.resolve(mockUsers)),
  getById: mock((id: string) => Promise.resolve(mockUsers.find(u => u.id === id))),
})

export const createMockIssueService = () => ({
  create: mock((payload) =>
    Promise.resolve({
      id: 'new-issue-id',
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  ),
  update: mock((id, payload) =>
    Promise.resolve({
      id,
      ...payload,
      updatedAt: new Date().toISOString(),
    })
  ),
  getAll: mock(() => Promise.resolve([])),
  getById: mock(() => Promise.resolve(undefined)),
  delete: mock(() => Promise.resolve()),
})
