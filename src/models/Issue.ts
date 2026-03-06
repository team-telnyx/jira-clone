import { v4 as uuidv4 } from 'uuid';
import type { Issue, CreateIssueInput, UpdateIssueInput, IssueFilters, PaginationParams, SortParams, PaginatedResponse } from '../types/index.js';

const issues: Map<string, Issue> = new Map();
const issueKeyCounters: Map<string, number> = new Map();

export function generateIssueKey(projectId: string, projectPrefix: string): string {
  const currentCount = issueKeyCounters.get(projectId) ?? 0;
  const nextCount = currentCount + 1;
  issueKeyCounters.set(projectId, nextCount);
  return `${projectPrefix}-${nextCount}`;
}

export function createIssue(
  projectId: string,
  projectPrefix: string,
  input: CreateIssueInput
): Issue {
  const issueKey = generateIssueKey(projectId, projectPrefix);
  
  const issue: Issue = {
    id: uuidv4(),
    issueKey,
    title: input.title,
    description: input.description,
    status: input.status ?? 'backlog',
    priority: input.priority ?? 'medium',
    type: input.type,
    assigneeId: input.assigneeId,
    reporterId: input.reporterId,
    projectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  issues.set(issue.id, issue);
  return issue;
}

export function findIssueById(id: string): Issue | null {
  const issue = issues.get(id);
  if (!issue || issue.deletedAt) return null;
  return issue;
}

export function findIssueByKey(projectId: string, issueKey: string): Issue | null {
  for (const issue of issues.values()) {
    if (issue.projectId === projectId && issue.issueKey === issueKey && !issue.deletedAt) {
      return issue;
    }
  }
  return null;
}

export function findIssueByIdOrKey(projectId: string, idOrKey: string): Issue | null {
  const byId = findIssueById(idOrKey);
  if (byId && byId.projectId === projectId) {
    return byId;
  }
  
  return findIssueByKey(projectId, idOrKey);
}

export function updateIssue(id: string, input: UpdateIssueInput): Issue | null {
  const issue = issues.get(id);
  if (!issue || issue.deletedAt) return null;
  
  const updated: Issue = {
    ...issue,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId ?? undefined }),
    updatedAt: new Date(),
  };
  
  issues.set(id, updated);
  return updated;
}

export function softDeleteIssue(id: string): boolean {
  const issue = issues.get(id);
  if (!issue || issue.deletedAt) return false;
  
  issue.deletedAt = new Date();
  issue.updatedAt = new Date();
  issues.set(id, issue);
  return true;
}

export function listIssuesByProject(
  projectId: string,
  filters: IssueFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 },
  sort: SortParams = { sortBy: 'createdAt', sortOrder: 'desc' }
): PaginatedResponse<Issue> {
  let projectIssues = Array.from(issues.values())
    .filter(issue => issue.projectId === projectId && !issue.deletedAt);
  
  if (filters.status) {
    projectIssues = projectIssues.filter(issue => issue.status === filters.status);
  }
  
  if (filters.priority) {
    projectIssues = projectIssues.filter(issue => issue.priority === filters.priority);
  }
  
  if (filters.type) {
    projectIssues = projectIssues.filter(issue => issue.type === filters.type);
  }
  
  if (filters.assigneeId) {
    projectIssues = projectIssues.filter(issue => issue.assigneeId === filters.assigneeId);
  }
  
  if (filters.q) {
    const searchTerm = filters.q.toLowerCase();
    projectIssues = projectIssues.filter(issue => 
      issue.title.toLowerCase().includes(searchTerm) ||
      (issue.description?.toLowerCase().includes(searchTerm) ?? false)
    );
  }
  
  const priorityOrder: Record<string, number> = {
    highest: 5,
    high: 4,
    medium: 3,
    low: 2,
    lowest: 1,
  };
  
  projectIssues.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.sortBy) {
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'priority':
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
    }
    
    return sort.sortOrder === 'desc' ? -comparison : comparison;
  });
  
  const total = projectIssues.length;
  const totalPages = Math.ceil(total / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit;
  const paginatedIssues = projectIssues.slice(startIndex, startIndex + pagination.limit);
  
  return {
    data: paginatedIssues,
    total,
    page: pagination.page,
    totalPages,
  };
}

export function issueKeyExists(projectId: string, issueKey: string): boolean {
  for (const issue of issues.values()) {
    if (issue.projectId === projectId && issue.issueKey === issueKey) {
      return true;
    }
  }
  return false;
}

export function clearIssues(): void {
  issues.clear();
  issueKeyCounters.clear();
}

export function countIssuesByProject(projectId: string): number {
  return Array.from(issues.values())
    .filter(issue => issue.projectId === projectId && !issue.deletedAt)
    .length;
}
