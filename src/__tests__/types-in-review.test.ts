import { describe, it, expect, vi } from 'vitest';
import { IssueStatus, KanbanItems, Issue } from '../types/issue';
import { updateIssueStatus } from '../api/issues';

describe('IssueStatus Type with IN_REVIEW', () => {
  it('should have IN_REVIEW as a valid IssueStatus type', () => {
    const validStatuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    
    validStatuses.forEach(status => {
      expect(status).toBeDefined();
    });
    
    expect(validStatuses).toContain('IN_REVIEW');
    expect(validStatuses).toContain('TODO');
    expect(validStatuses).toContain('IN_PROGRESS');
    expect(validStatuses).toContain('DONE');
  });

  it('should allow creating an Issue with IN_REVIEW status', () => {
    const issue: Issue = {
      id: 'ISSUE-TEST',
      title: 'Test Issue',
      description: 'A test issue for IN_REVIEW status',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(issue.status).toBe('IN_REVIEW');
    expect(issue.status).toBeDefined();
  });

  it('should allow KanbanItems with four columns including IN_REVIEW', () => {
    const items: KanbanItems = {
      TODO: ['ISSUE-1', 'ISSUE-2'],
      IN_PROGRESS: ['ISSUE-3'],
      IN_REVIEW: ['ISSUE-4', 'ISSUE-5'],
      DONE: ['ISSUE-6'],
    };

    expect(items).toHaveProperty('TODO');
    expect(items).toHaveProperty('IN_PROGRESS');
    expect(items).toHaveProperty('IN_REVIEW');
    expect(items).toHaveProperty('DONE');
    expect(Object.keys(items)).toHaveLength(4);
  });

  it('should types match for all four columns', () => {
    const statusTodo: IssueStatus = 'TODO';
    const statusInProgress: IssueStatus = 'IN_PROGRESS';
    const statusInReview: IssueStatus = 'IN_REVIEW';
    const statusDone: IssueStatus = 'DONE';

    expect(statusTodo).toBe('TODO');
    expect(statusInProgress).toBe('IN_PROGRESS');
    expect(statusInReview).toBe('IN_REVIEW');
    expect(statusDone).toBe('DONE');
  });
});

describe('API with IN_REVIEW support', () => {
  it('should update issue status to IN_REVIEW', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'ISSUE-1',
        title: 'Test Issue',
        status: 'IN_REVIEW',
      }),
    });

    const result = await updateIssueStatus('ISSUE-1', 'IN_REVIEW');
    expect(result.status).toBe('IN_REVIEW');
    
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/issues/ISSUE-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_REVIEW' }),
      })
    );
  });
});
