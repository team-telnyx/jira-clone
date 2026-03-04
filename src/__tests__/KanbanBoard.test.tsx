import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../components/KanbanBoard';

const mockIssues = [
  {
    id: 'ISSUE-1',
    title: 'Fix login bug',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ISSUE-2',
    title: 'Add tests',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ISSUE-3',
    title: 'Deploy to prod',
    status: 'DONE',
    priority: 'LOW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('KanbanBoard', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockIssues),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('AC-1: Kanban board displays issues in columns', () => {
    it('should render three columns for TODO, IN_PROGRESS, DONE', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByText('TODO')).toBeInTheDocument();
        expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
        expect(screen.getByText('DONE')).toBeInTheDocument();
      });
    });

    it('should display issues in their respective columns by status', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
      });

      const todoColumn = screen.getByTestId('column-TODO');
      const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
      const doneColumn = screen.getByTestId('column-DONE');

      expect(todoColumn).toHaveTextContent('Fix login bug');
      expect(inProgressColumn).toHaveTextContent('Add tests');
      expect(doneColumn).toHaveTextContent('Deploy to prod');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      render(<KanbanBoard />);
      expect(screen.getByTestId('kanban-loading')).toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attributes', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
      });

      expect(screen.getByTestId('column-TODO')).toBeInTheDocument();
      expect(screen.getByTestId('column-IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByTestId('column-DONE')).toBeInTheDocument();
      expect(screen.getByTestId('issue-ISSUE-1')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes on draggable items', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
      });

      const draggableItem = screen.getByTestId('issue-ISSUE-1');
      expect(draggableItem).toHaveAttribute('role', 'button');
      expect(draggableItem).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Column Count', () => {
    it('should display item count for each column', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
      });

      const todoColumn = screen.getByTestId('column-TODO');
      const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
      const doneColumn = screen.getByTestId('column-DONE');

      expect(todoColumn).toHaveTextContent('1');
      expect(inProgressColumn).toHaveTextContent('1');
      expect(doneColumn).toHaveTextContent('1');
    });
  });
});
