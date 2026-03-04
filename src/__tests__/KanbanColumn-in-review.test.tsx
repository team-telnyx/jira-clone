import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import KanbanColumn from '../components/KanbanColumn';
import { Issue } from '../types/issue';

function renderWithDndContext(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('KanbanColumn Component with IN_REVIEW', () => {
  const inReviewIssues: Issue[] = [
    {
      id: 'ISSUE-REVIEW-1',
      title: 'Code review request 1',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ISSUE-REVIEW-2',
      title: 'Code review request 2',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should render IN_REVIEW column header with correct title', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    expect(screen.getByText('IN_REVIEW')).toBeInTheDocument();
  });

  it('should render all IN_REVIEW issues passed to column', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    expect(screen.getByText('Code review request 1')).toBeInTheDocument();
    expect(screen.getByText('Code review request 2')).toBeInTheDocument();
  });

  it('should have correct data-testid for IN_REVIEW column', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    const column = screen.getByTestId('column-IN_REVIEW');
    expect(column).toBeInTheDocument();
    expect(column).toHaveClass('column-droppable');
  });

  it('should show item count for IN_REVIEW column', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should have droppable attributes when IN_REVIEW column is empty', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={[]} />
    );

    const column = screen.getByTestId('column-IN_REVIEW');
    expect(column).toHaveAttribute('data-droppable', 'true');
  });

  it('should show IN_REVIEW column with isOver state', () => {
    renderWithDndContext(
      <KanbanColumn 
        id="IN_REVIEW" 
        title="IN_REVIEW" 
        items={inReviewIssues} 
        isOver={true}
      />
    );

    const column = screen.getByTestId('column-IN_REVIEW');
    expect(column).toHaveAttribute('data-drop-target', 'true');
  });

  it('should render mixed priority issues in IN_REVIEW column', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render IN_REVIEW issue items with correct test ids', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_REVIEW" title="IN_REVIEW" items={inReviewIssues} />
    );

    expect(screen.getByTestId('issue-ISSUE-REVIEW-1')).toBeInTheDocument();
    expect(screen.getByTestId('issue-ISSUE-REVIEW-2')).toBeInTheDocument();
  });
});
