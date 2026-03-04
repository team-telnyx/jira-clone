import { useState, useRef, useCallback } from 'react';
import { Issue, IssueStatus, KanbanItems } from '../types/issue';

function groupIssuesByStatus(issues: Issue[]): KanbanItems {
  const grouped: KanbanItems = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  for (const issue of issues) {
    grouped[issue.status].push(issue.id);
  }

  return grouped;
}

export function useKanbanState(initialIssues: Issue[]) {
  const [items, setItems] = useState<KanbanItems>(() =>
    groupIssuesByStatus(initialIssues)
  );
  const snapshotRef = useRef<KanbanItems | null>(null);

  const startDrag = useCallback(() => {
    snapshotRef.current = {
      TODO: [...items.TODO],
      IN_PROGRESS: [...items.IN_PROGRESS],
      DONE: [...items.DONE],
    };
  }, [items]);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const getItemsSnapshot = useCallback(
    () => ({
      TODO: [...items.TODO],
      IN_PROGRESS: [...items.IN_PROGRESS],
      DONE: [...items.DONE],
    }),
    [items]
  );

  const rollback = useCallback(() => {
    if (snapshotRef.current) {
      setItems(snapshotRef.current);
      snapshotRef.current = null;
    }
  }, []);

  const moveItem = useCallback(
    (
      itemId: string,
      fromColumn: IssueStatus,
      toColumn: IssueStatus,
      toIndex: number
    ) => {
      setItems((prev) => {
        const newItems = {
          TODO: [...prev.TODO],
          IN_PROGRESS: [...prev.IN_PROGRESS],
          DONE: [...prev.DONE],
        };

        const fromIndex = newItems[fromColumn].indexOf(itemId);
        if (fromIndex === -1) return prev;

        newItems[fromColumn].splice(fromIndex, 1);

        const clampedIndex = Math.min(toIndex, newItems[toColumn].length);
        newItems[toColumn].splice(clampedIndex, 0, itemId);

        return newItems;
      });
    },
    []
  );

  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null;
  }, []);

  return {
    items,
    setItems,
    moveItem,
    startDrag,
    getSnapshot,
    getItemsSnapshot,
    rollback,
    clearSnapshot,
  };
}
