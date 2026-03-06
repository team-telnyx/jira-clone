export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'closed';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type IssueType = 'bug' | 'task' | 'story' | 'epic';

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
  createdAt: string;
  updatedAt: string;
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
