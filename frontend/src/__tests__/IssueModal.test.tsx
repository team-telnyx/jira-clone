import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueModal } from '../components/IssueModal';
import type { Issue } from '../types';

vi.mock('../services/api', () => ({
  createIssue: vi.fn(() => Promise.resolve({
    id: '123',
    issueKey: 'TEST-1',
    title: 'Test',
    status: 'backlog',
    priority: 'medium',
    type: 'task',
    reporterId: 'user-1',
    projectId: 'proj-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })),
  updateIssue: vi.fn(() => Promise.resolve({
    id: '1',
    issueKey: 'TEST-1',
    title: 'Updated',
    status: 'in_progress',
    priority: 'high',
    type: 'bug',
    reporterId: 'user-1',
    projectId: 'proj-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })),
  getIssue: vi.fn(),
}));

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  mode: 'create' as const,
  projectId: 'proj-1',
  reporterId: 'user-1',
};

const mockIssue: Issue = {
  id: '1',
  issueKey: 'TEST-1',
  title: 'Test Issue',
  description: 'Test Description',
  status: 'in_progress',
  priority: 'high',
  type: 'bug',
  reporterId: 'user-1',
  projectId: 'proj-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('IssueModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create modal with all required fields', () => {
      render(<IssueModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /create issue/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render correct select options for priority field', () => {
      render(<IssueModal {...defaultProps} />);

      const prioritySelect = screen.getByLabelText(/priority/i);
      const options = prioritySelect.querySelectorAll('option');
      const values = Array.from(options).map(o => o.value);
      expect(values).toContain('low');
      expect(values).toContain('medium');
      expect(values).toContain('high');
    });

    it('should render correct select options for type field', () => {
      render(<IssueModal {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/type/i);
      const options = typeSelect.querySelectorAll('option');
      const values = Array.from(options).map(o => o.value);
      expect(values).toContain('bug');
      expect(values).toContain('task');
      expect(values).toContain('story');
    });

    it('should not render when isOpen is false', () => {
      render(<IssueModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('issue-modal')).not.toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('should pre-populate fields when editing existing issue', () => {
      render(
        <IssueModal
          {...defaultProps}
          mode="edit"
          issue={mockIssue}
        />
      );

      expect(screen.getByRole('heading', { name: /edit issue/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toHaveValue('Test Issue');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
      expect(screen.getByLabelText(/status/i)).toHaveValue('in_progress');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('high');
      expect(screen.getByLabelText(/type/i)).toHaveValue('bug');
    });
  });

  describe('Form validation', () => {
    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      render(<IssueModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should enforce maximum length on title field', async () => {
      const user = userEvent.setup();
      render(<IssueModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(256);

      await user.type(titleInput, longTitle);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be less than/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<IssueModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking overlay', async () => {
      const user = userEvent.setup();
      render(<IssueModal {...defaultProps} />);

      const modalOverlay = screen.getByTestId('modal-overlay');
      await user.click(modalOverlay);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
