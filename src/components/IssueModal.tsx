import { useCallback, useEffect, useRef } from 'react'
import type { Issue } from '../types/issue'
import { IssueStatus, IssuePriority, IssueType } from '../types/issue'
import { useIssueForm } from '../hooks/useIssueForm'

interface IssueModalProps {
  isOpen: boolean
  onClose: () => void
  issue?: Issue
  onSuccess?: (issue: Issue) => void
}

const STATUS_OPTIONS = [
  { value: IssueStatus.TODO, label: 'To Do' },
  { value: IssueStatus.IN_PROGRESS, label: 'In Progress' },
  { value: IssueStatus.IN_REVIEW, label: 'In Review' },
  { value: IssueStatus.DONE, label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: IssuePriority.LOW, label: 'Low' },
  { value: IssuePriority.MEDIUM, label: 'Medium' },
  { value: IssuePriority.HIGH, label: 'High' },
]

const TYPE_OPTIONS = [
  { value: IssueType.STORY, label: 'Story' },
  { value: IssueType.BUG, label: 'Bug' },
  { value: IssueType.TASK, label: 'Task' },
  { value: IssueType.EPIC, label: 'Epic' },
]

export function IssueModal({ isOpen, onClose, issue, onSuccess }: IssueModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  const {
    formData,
    errors,
    users,
    isLoading,
    isSubmitting,
    apiError,
    isEditMode,
    handleChange,
    handleSubmit,
  } = useIssueForm({ issue, onSuccess, onClose })

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      titleInputRef.current?.focus()
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content"
        role="document"
      >
        <header className="modal-header">
          <h2 id="modal-title">
            {isEditMode ? 'Edit Issue' : 'Create Issue'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        {apiError && (
          <div className="error-banner" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title" className="form-label required">
              Title
            </label>
            <input
              ref={titleInputRef}
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'title-error' : undefined}
              maxLength={255}
            />
            {errors.title && (
              <p id="title-error" className="form-error">
                {errors.title}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
              rows={4}
            />
            {errors.description && (
              <p id="description-error" className="form-error">
                {errors.description}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label required">
                Status
              </label>
              <select
                id="status"
                className={`form-select ${errors.status ? 'error' : ''}`}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.status)}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="form-error">{errors.status}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label required">
                Priority
              </label>
              <select
                id="priority"
                className={`form-select ${errors.priority ? 'error' : ''}`}
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.priority)}
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="form-error">{errors.priority}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type" className="form-label required">
                Type
              </label>
              <select
                id="type"
                className={`form-select ${errors.type ? 'error' : ''}`}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.type)}
              >
                {TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="form-error">{errors.type}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="assignee" className="form-label">
                Assignee
              </label>
              <select
                id="assignee"
                className="form-select"
                value={formData.assigneeId}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                disabled={isSubmitting || isLoading}
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting && <span className="loading-spinner" />}
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
