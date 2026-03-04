export const IssueStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const

export type IssueStatusType = (typeof IssueStatus)[keyof typeof IssueStatus]

export const IssuePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type IssuePriorityType = (typeof IssuePriority)[keyof typeof IssuePriority]

export const IssueType = {
  STORY: 'STORY',
  BUG: 'BUG',
  TASK: 'TASK',
  EPIC: 'EPIC',
} as const

export type IssueTypeType = (typeof IssueType)[keyof typeof IssueType]

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatusType
  priority: IssuePriorityType
  type: IssueTypeType
  assigneeId: string | null
  assignee?: User | null
  createdAt: string
  updatedAt: string
}

export interface CreateIssuePayload {
  title: string
  description: string
  status: IssueStatusType
  priority: IssuePriorityType
  type: IssueTypeType
  assigneeId: string | null
}

export interface UpdateIssuePayload extends Partial<CreateIssuePayload> {
  id: string
}

export interface IssueFormData {
  title: string
  description: string
  status: IssueStatusType
  priority: IssuePriorityType
  type: IssueTypeType
  assigneeId: string
}

export interface IssueFormErrors {
  title?: string
  description?: string
  status?: string
  priority?: string
  type?: string
  assigneeId?: string
}
