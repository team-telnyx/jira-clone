import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../components/KanbanBoard';

const mockIssuesWithInReview = [
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
    title: 'Code review needed',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ISSUE-4',
    title: 'Deploy to prod',
    status: 'DONE',
    priority: 'LOW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('KanbanBoard with Four Columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockIssuesWithInReview),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('AC-1: Four Column Layout', () => {
    it('should render four columns for TODO, IN_PROGRESS, IN_REVIEW, DONE', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByText('TODO')).toBeInTheDocument();
        expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
        expect(screen.getByText('IN_REVIEW')).toBeInTheDocument();
        expect(screen.getByText('DONE')).toBeInTheDocument();
      });
    });

    it('should display issues in their respective columns including IN_REVIEW', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('issue-ISSUE-3')).toBeInTheDocument();
      });

      const todoColumn = screen.getByTestId('column-TODO');
      const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
      const inReviewColumn = screen.getByTestId('column-IN_REVIEW');
      const doneColumn = screen.getByTestId('column-DONE');

      expect(todoColumn).toHaveTextContent('Fix login bug');
      expect(inProgressColumn).toHaveTextContent('Add tests');
      expect(inReviewColumn).toHaveTextContent('Code review needed');
      expect(doneColumn).toHaveTextContent('Deploy to prod');
    });

    it('should have proper data-testid attributes for all four columns', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('issue-ISSUE-3')).toBeInTheDocument();
      });

      expect(screen.getByTestId('column-TODO')).toBeInTheDocument();
      expect(screen.getByTestId('column-IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByTestId('column-IN_REVIEW')).toBeInTheDocument();
      expect(screen.getByTestId('column-DONE')).toBeInTheDocument();
      expect(screen.getByTestId('issue-ISSUE-3')).toBeInTheDocument();
    });

    it('should display item count for all four columns', async () => {
      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('issue-ISSUE-1')).toBeInTheDocument();
      });

      const todoColumn = screen.getByTestId('column-TODO');
      const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
      const inReviewColumn = screen.getByTestId('column-IN_REVIEW');
      const doneColumn = screen.getByTestId('column-DONE');

      expect(todoColumn).toHaveTextContent('1');
      expect(inProgressColumn).toHaveTextContent('1');
      expect(inReviewColumn).toHaveTextContent('1');
      expect(doneColumn).toHaveTextContent('1');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially for four column board', () => {
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
});
