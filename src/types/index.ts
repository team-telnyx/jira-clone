export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'closed';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type IssueType = 'bug' | 'task' | 'story' | 'epic';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Issue {
  id: string;
  issueKey: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  assigneeId?: string;
  reporterId: string;
  projectId: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type: IssueType;
  assigneeId?: string;
  reporterId: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface IssueFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  q?: string;
}

export interface SortParams {
  sortBy: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
