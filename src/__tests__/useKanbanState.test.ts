import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanState } from '../hooks/useKanbanState';
import { Issue } from '../types/issue';

const createMockIssues = (): Issue[] => [
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
    title: 'Deploy',
    status: 'DONE',
    priority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('useKanbanState Hook', () => {
  it('should initialize with grouped issues by status', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    expect(result.current.items).toEqual({
      TODO: ['ISSUE-1', 'ISSUE-2'],
      IN_PROGRESS: ['ISSUE-3'],
      DONE: ['ISSUE-4'],
    });
  });

  it('should move item within same column', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'TODO', 1);
    });

    expect(result.current.items.TODO).toEqual(['ISSUE-2', 'ISSUE-1']);
    expect(result.current.items.IN_PROGRESS).toEqual(['ISSUE-3']);
    expect(result.current.items.DONE).toEqual(['ISSUE-4']);
  });

  it('should move item between different columns and update status', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'DONE', 1);
    });

    expect(result.current.items.TODO).toEqual(['ISSUE-2']);
    expect(result.current.items.IN_PROGRESS).toEqual(['ISSUE-3']);
    expect(result.current.items.DONE).toEqual(['ISSUE-4', 'ISSUE-1']);
  });

  it('should create snapshot on drag start for rollback', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    const initialSnapshot = result.current.getItemsSnapshot();

    act(() => {
      result.current.startDrag();
    });

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'DONE', 1);
    });

    expect(result.current.getSnapshot()).toEqual(initialSnapshot);
  });

  it('should restore snapshot on rollback', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    const initialState = { ...result.current.items };

    act(() => {
      result.current.startDrag();
    });

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'DONE', 1);
    });

    expect(result.current.items).not.toEqual(initialState);

    act(() => {
      result.current.rollback();
    });

    expect(result.current.items).toEqual(initialState);
  });

  it('should handle dropping into empty column', () => {
    const issuesWithEmptyDone: Issue[] = [
      {
        id: 'ISSUE-1',
        title: 'Fix login',
        status: 'TODO',
        priority: 'HIGH',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { result } = renderHook(() => useKanbanState(issuesWithEmptyDone));

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'DONE', 0);
    });

    expect(result.current.items.TODO).toEqual([]);
    expect(result.current.items.DONE).toEqual(['ISSUE-1']);
  });

  it('should update issue order correctly when multiple issues exist', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    act(() => {
      result.current.moveItem('ISSUE-3', 'IN_PROGRESS', 'TODO', 0);
    });

    expect(result.current.items.TODO).toEqual([
      'ISSUE-3',
      'ISSUE-1',
      'ISSUE-2',
    ]);
    expect(result.current.items.IN_PROGRESS).toEqual([]);
    expect(result.current.items.DONE).toEqual(['ISSUE-4']);
  });

  it('should maintain issue data integrity during moves', () => {
    const { result } = renderHook(() => useKanbanState(createMockIssues()));

    const getAllItems = () => [
      ...result.current.items.TODO,
      ...result.current.items.IN_PROGRESS,
      ...result.current.items.DONE,
    ];

    const initialCount = getAllItems().length;

    act(() => {
      result.current.moveItem('ISSUE-1', 'TODO', 'DONE', 1);
    });

    expect(getAllItems().length).toBe(initialCount);

    const allItems = getAllItems();
    const uniqueItems = [...new Set(allItems)];
    expect(uniqueItems.length).toBe(allItems.length);
  });
});
