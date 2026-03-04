import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Issue, IssueStatus, KanbanItems } from '../types/issue';
import { getIssues, updateIssueStatus } from '../api/issues';
import { useKanbanState } from '../hooks/useKanbanState';
import KanbanColumn from './KanbanColumn';
import KanbanItem from './KanbanItem';
import styles from './KanbanBoard.module.css';

const COLUMNS: { id: IssueStatus; title: string }[] = [
  { id: 'TODO', title: 'TODO' },
  { id: 'IN_PROGRESS', title: 'IN_PROGRESS' },
  { id: 'IN_REVIEW', title: 'IN_REVIEW' },
  { id: 'DONE', title: 'DONE' },
];

function findColumnForItem(
  items: KanbanItems,
  itemId: string
): IssueStatus | null {
  for (const [column, ids] of Object.entries(items)) {
    if (ids.includes(itemId)) {
      return column as IssueStatus;
    }
  }
  return null;
}

export default function KanbanBoard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const prevStatusRef = useRef<{ itemId: string; status: IssueStatus } | null>(
    null
  );

  const {
    items,
    moveItem,
    startDrag,
    rollback,
    clearSnapshot,
    setItems,
  } = useKanbanState(issues);

  const issuesMap = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of issues) {
      map.set(issue.id, issue);
    }
    return map;
  }, [issues]);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await getIssues();
        setIssues(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load issues');
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  useEffect(() => {
    const groupedItems: KanbanItems = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };
    for (const issue of issues) {
      groupedItems[issue.status].push(issue.id);
    }
    setItems(groupedItems);
  }, [issues, setItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);
      startDrag();

      const currentColumn = findColumnForItem(items, active.id as string);
      if (currentColumn) {
        prevStatusRef.current = {
          itemId: active.id as string,
          status: currentColumn,
        };
      }
    },
    [items, startDrag]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) {
        setOverColumnId(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnForItem(items, activeId);
      let overColumn: IssueStatus | null = null;

      if (over.data.current?.type === 'column') {
        overColumn = overId as IssueStatus;
      } else {
        overColumn = findColumnForItem(items, overId);
      }

      setOverColumnId(overColumn);

      if (!activeColumn || !overColumn) return;

      if (activeColumn !== overColumn) {
        const overIndex =
          over.data.current?.type === 'column'
            ? items[overColumn].length
            : items[overColumn].indexOf(overId);

        moveItem(activeId, activeColumn, overColumn, overIndex);
      }
    },
    [items, moveItem]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverColumnId(null);

      if (!over) {
        rollback();
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnForItem(items, activeId);
      let targetColumn: IssueStatus | null = null;

      if (over.data.current?.type === 'column') {
        targetColumn = overId as IssueStatus;
      } else {
        targetColumn = findColumnForItem(items, overId);
      }

      if (!activeColumn || !targetColumn) {
        rollback();
        return;
      }

      if (
        over.data.current?.type !== 'column' &&
        activeColumn === targetColumn
      ) {
        const activeIndex = items[activeColumn].indexOf(activeId);
        const overIndex = items[activeColumn].indexOf(overId);

        if (activeIndex !== overIndex) {
          moveItem(activeId, activeColumn, targetColumn, overIndex);
        }
      }

      const prevStatus = prevStatusRef.current;
      prevStatusRef.current = null;

      if (prevStatus && prevStatus.status !== targetColumn) {
        try {
          await updateIssueStatus(activeId, targetColumn);

          setIssues((prevIssues) =>
            prevIssues.map((issue) =>
              issue.id === activeId ? { ...issue, status: targetColumn } : issue
            )
          );
          clearSnapshot();
        } catch {
          rollback();
        }
      } else {
        clearSnapshot();
      }
    },
    [items, moveItem, rollback, clearSnapshot]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverColumnId(null);
    prevStatusRef.current = null;
    rollback();
  }, [rollback]);

  const getIssuesForColumn = useCallback(
    (columnId: IssueStatus): Issue[] => {
      return items[columnId]
        .map((id) => issuesMap.get(id))
        .filter((issue): issue is Issue => issue !== undefined);
    },
    [items, issuesMap]
  );

  const activeIssue = activeId ? issuesMap.get(activeId) : null;

  if (loading) {
    return (
      <div className={styles.loading} data-testid="kanban-loading">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} data-testid="kanban-error">
        {error}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.board} data-testid="kanban-board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            items={getIssuesForColumn(column.id)}
            isOver={overColumnId === column.id}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue ? (
          <KanbanItem
            id={activeIssue.id}
            issue={activeIssue}
            index={0}
            column={activeIssue.status}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
