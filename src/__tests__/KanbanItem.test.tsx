import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import KanbanItem from '../components/KanbanItem';
import { Issue } from '../types/issue';

function renderWithDndContext(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('KanbanItem Component', () => {
  const mockIssue: Issue = {
    id: 'ISSUE-1',
    title: 'Fix critical bug',
    description: 'Login is broken',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  it('should render issue title and priority', () => {
    renderWithDndContext(
      <KanbanItem id={mockIssue.id} issue={mockIssue} index={0} column="TODO" />
    );

    expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should have sortable attributes', () => {
    renderWithDndContext(
      <KanbanItem id={mockIssue.id} issue={mockIssue} index={0} column="TODO" />
    );

    const item = screen.getByTestId('issue-ISSUE-1');
    expect(item).toHaveAttribute('data-sortable', 'true');
    expect(item).toHaveAttribute('role', 'button');
    expect(item).toHaveAttribute('tabIndex', '0');
  });

  it('should have proper ARIA attributes for accessibility', () => {
    renderWithDndContext(
      <KanbanItem id={mockIssue.id} issue={mockIssue} index={0} column="TODO" />
    );

    const item = screen.getByTestId('issue-ISSUE-1');
    expect(item).toHaveAttribute('aria-describedby');
  });

  it('should render issues with different priorities', () => {
    const mediumPriorityIssue: Issue = {
      ...mockIssue,
      id: 'ISSUE-2',
      priority: 'MEDIUM',
    };

    renderWithDndContext(
      <KanbanItem
        id={mediumPriorityIssue.id}
        issue={mediumPriorityIssue}
        index={0}
        column="TODO"
      />
    );

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render low priority issues', () => {
    const lowPriorityIssue: Issue = {
      ...mockIssue,
      id: 'ISSUE-3',
      priority: 'LOW',
    };

    renderWithDndContext(
      <KanbanItem
        id={lowPriorityIssue.id}
        issue={lowPriorityIssue}
        index={0}
        column="TODO"
      />
    );

    expect(screen.getByText('LOW')).toBeInTheDocument();
  });
});
