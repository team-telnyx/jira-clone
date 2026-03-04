import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import KanbanColumn from '../components/KanbanColumn';
import { Issue, IssueStatus } from '../types/issue';

function renderWithDndContext(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('KanbanColumn Component', () => {
  const mockIssues: Issue[] = [
    {
      id: 'ISSUE-1',
      title: 'Fix bug',
      status: 'TODO' as IssueStatus,
      priority: 'HIGH',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ISSUE-2',
      title: 'Add feature',
      status: 'TODO' as IssueStatus,
      priority: 'MEDIUM',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should render column header with correct title', () => {
    renderWithDndContext(
      <KanbanColumn id="TODO" title="TODO" items={mockIssues} />
    );

    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('should render all issues passed to column', () => {
    renderWithDndContext(
      <KanbanColumn id="TODO" title="TODO" items={mockIssues} />
    );

    expect(screen.getByText('Fix bug')).toBeInTheDocument();
    expect(screen.getByText('Add feature')).toBeInTheDocument();
  });

  it('should have droppable attributes when empty', () => {
    renderWithDndContext(
      <KanbanColumn id="DONE" title="DONE" items={[]} />
    );

    const column = screen.getByTestId('column-DONE');
    expect(column).toHaveAttribute('data-droppable', 'true');
  });

  it('should have droppable class', () => {
    renderWithDndContext(
      <KanbanColumn id="IN_PROGRESS" title="In Progress" items={[]} />
    );

    const column = screen.getByTestId('column-IN_PROGRESS');
    expect(column).toHaveClass('column-droppable');
  });

  it('should display priority indicators', () => {
    renderWithDndContext(
      <KanbanColumn id="TODO" title="TODO" items={mockIssues} />
    );

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should show item count', () => {
    renderWithDndContext(
      <KanbanColumn id="TODO" title="TODO" items={mockIssues} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
