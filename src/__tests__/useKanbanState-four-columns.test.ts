import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanState } from '../hooks/useKanbanState';
import { Issue } from '../types/issue';

const createMockIssuesWithInReview = (): Issue[] => [
  {
    id: 'ISSUE-1',
    title: 'Fix login bug',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ISSUE-2',
    title: 'Add tests',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ISSUE-3',
    title: 'Write docs',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ISSUE-4',
    title: 'Code review item 1',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ISSUE-5',
    title: 'Code review item 2',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ISSUE-6',
    title: 'Deploy ready',
    status: 'DONE',
    priority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('useKanbanState Hook with Four Columns', () => {
  it('should initialize with four columns grouped by status including IN_REVIEW', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    expect(result.current.items).toEqual({
      TODO: ['ISSUE-1', 'ISSUE-2'],
      IN_PROGRESS: ['ISSUE-3'],
      IN_REVIEW: ['ISSUE-4', 'ISSUE-5'],
      DONE: ['ISSUE-6'],
    });
  });

  it('should move item to IN_REVIEW column from TODO', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'IN_REVIEW', 2);
    });

    expect(result.current.items.TODO).toEqual(['ISSUE-2']);
    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-4', 'ISSUE-5', 'ISSUE-1']);
    expect(result.current.items.DONE).toEqual(['ISSUE-6']);
  });

  it('should move item from IN_REVIEW to DONE', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    act(() => {
      result.current.moveItem('ISSUE-4', 'IN_REVIEW', 'DONE', 1);
    });

    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-5']);
    expect(result.current.items.DONE).toEqual(['ISSUE-6', 'ISSUE-4']);
  });

  it('should handle dropping into empty IN_REVIEW column', () => {
    const issuesWithEmptyInReview: Issue[] = [
      {
        id: 'ISSUE-1',
        title: 'Fix login',
        status: 'TODO',
        priority: 'HIGH',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { result } = renderHook(() => useKanbanState(issuesWithEmptyInReview));

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'IN_REVIEW', 0);
    });

    expect(result.current.items.TODO).toEqual([]);
    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-1']);
    expect(result.current.items.DONE).toEqual([]);
  });

  it('should move item within IN_REVIEW column', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    act(() => {
      result.current.moveItem('ISSUE-5', 'IN_REVIEW', 'IN_REVIEW', 0);
    });

    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-5', 'ISSUE-4']);
  });

  it('should maintain four column integrity during moves', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    const getAllItems = () => [
      ...result.current.items.TODO,
      ...result.current.items.IN_PROGRESS,
      ...result.current.items.IN_REVIEW,
      ...result.current.items.DONE,
    ];

    const initialCount = getAllItems().length;

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'IN_REVIEW', 0);
    });

    act(() => {
      result.current.moveItem('ISSUE-5', 'IN_REVIEW', 'DONE', 1);
    });

    expect(getAllItems().length).toBe(initialCount);

    const allItems = getAllItems();
    const uniqueItems = [...new Set(allItems)];
    expect(uniqueItems.length).toBe(allItems.length);
  });

  it('should create snapshot including IN_REVIEW for rollback', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    act(() => {
      result.current.startDrag();
    });

    const snapshot = result.current.getSnapshot();
    expect(snapshot).toBeDefined();
    if (snapshot) {
      expect(snapshot).toHaveProperty('IN_REVIEW');
      expect(snapshot.IN_REVIEW).toEqual(['ISSUE-4', 'ISSUE-5']);
    }
  });

  it('should restore snapshot including IN_REVIEW on rollback', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssuesWithInReview()));

    act(() => {
      result.current.startDrag();
    });

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'IN_REVIEW', 0);
    });

    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-1', 'ISSUE-4', 'ISSUE-5']);

    act(() => {
      result.current.rollback();
    });

    expect(result.current.items.IN_REVIEW).toEqual(['ISSUE-4', 'ISSUE-5']);
    expect(result.current.items.TODO).toEqual(['ISSUE-1', 'ISSUE-2']);
  });
});
