import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Issue, IssueStatus } from '../types/issue';
import KanbanItem from './KanbanItem';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  id: IssueStatus;
  title: string;
  items: Issue[];
  isOver?: boolean;
}

export default function KanbanColumn({
  id,
  title,
  items,
  isOver,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      column: id,
    },
  });

  const itemIds = items.map((item) => item.id);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''} column-droppable`}
      data-testid={`column-${id}`}
      data-droppable="true"
      data-drop-target={isOver ? 'true' : undefined}
      style={isOver ? { border: '2px solid blue' } : undefined}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{items.length}</span>
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={styles.items}>
          {items.map((issue, index) => (
            <KanbanItem
              key={issue.id}
              id={issue.id}
              issue={issue}
              index={index}
              column={id}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
