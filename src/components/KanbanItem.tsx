import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue, IssueStatus } from '../types/issue';
import styles from './KanbanItem.module.css';

interface KanbanItemProps {
  id: string;
  issue: Issue;
  index: number;
  column: IssueStatus;
}

export default function KanbanItem({ id, issue, column }: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'issue',
      issue,
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityClass = styles[`priority${issue.priority}`] || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${priorityClass}`}
      data-testid={`issue-${id}`}
      data-sortable="true"
      data-dragging={isDragging ? 'true' : undefined}
      {...attributes}
      {...listeners}
    >
      <span className={styles.title}>{issue.title}</span>
      <span className={`${styles.priority} ${priorityClass}`}>
        {issue.priority}
      </span>
    </div>
  );
}
