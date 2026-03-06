import React, { useState, useEffect, useCallback } from 'react';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../types';
import { createIssue, updateIssue } from '../services/api';
import './IssueModal.css';

export interface IssueFormData {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
}

export interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issue: Issue) => void;
  mode: 'create' | 'edit';
  issue?: Issue;
  projectId: string;
  reporterId: string;
}

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'lowest', label: 'Lowest' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'highest', label: 'Highest' },
];

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'task', label: 'Task' },
  { value: 'story', label: 'Story' },
  { value: 'epic', label: 'Epic' },
];

const INITIAL_FORM_DATA: IssueFormData = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  type: 'task',
};

interface FormErrors {
  title?: string;
  description?: string;
  general?: string;
}

export function IssueModal({
  isOpen,
  onClose,
  onSave,
  mode,
  issue,
  projectId,
  reporterId,
}: IssueModalProps): React.ReactElement | null {
  const [formData, setFormData] = useState<IssueFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && issue) {
        setFormData({
          title: issue.title,
          description: issue.description ?? '',
          status: issue.status,
          priority: issue.priority,
          type: issue.type,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
      setErrors({});
      setSuccessMessage(null);
    }
  }, [isOpen, mode, issue]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let savedIssue: Issue;

      if (mode === 'create') {
        savedIssue = await createIssue(projectId, {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          type: formData.type,
          reporterId,
        });
        setSuccessMessage('Issue created successfully');
      } else if (issue) {
        savedIssue = await updateIssue(projectId, issue.id, {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          type: formData.type,
        });
        setSuccessMessage('Issue updated successfully');
      } else {
        throw new Error('Issue is required for edit mode');
      }

      setTimeout(() => {
        onSave(savedIssue);
        onClose();
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save issue';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      data-testid="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="modal-content" data-testid="issue-modal" role="dialog" aria-modal="true">
        <h2>{mode === 'create' ? 'Create Issue' : 'Edit Issue'}</h2>

        {successMessage && (
          <div className="success-message" data-testid="success-message" role="alert">
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className="error-message" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter issue title"
              data-testid="title-input"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <span id="title-error" className="field-error" role="alert">
                {errors.title}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter issue description"
              rows={4}
              data-testid="description-textarea"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <span id="description-error" className="field-error" role="alert">
                {errors.description}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              data-testid="status-select"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              data-testid="priority-select"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              data-testid="type-select"
            >
              {TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isSubmitting}
              data-testid="save-button"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IssueModal;
