import { describe, it, expect } from 'bun:test'
import { validateIssueForm, hasErrors } from './validation'
import { IssueStatus, IssuePriority, IssueType } from '../types/issue'
import type { IssueFormData } from '../types/issue'

describe('validateIssueForm', () => {
  const validFormData: IssueFormData = {
    title: 'Valid Title',
    description: 'Valid description',
    status: IssueStatus.TODO,
    priority: IssuePriority.MEDIUM,
    type: IssueType.TASK,
    assigneeId: '',
  }

  it('returns no errors for valid data', () => {
    const errors = validateIssueForm(validFormData)
    expect(errors).toEqual({})
  })

  it('returns error when title is empty', () => {
    const errors = validateIssueForm({ ...validFormData, title: '' })
    expect(errors.title).toBe('Title is required')
  })

  it('returns error when title is only whitespace', () => {
    const errors = validateIssueForm({ ...validFormData, title: '   ' })
    expect(errors.title).toBe('Title is required')
  })

  it('returns error when title exceeds max length', () => {
    const longTitle = 'a'.repeat(256)
    const errors = validateIssueForm({ ...validFormData, title: longTitle })
    expect(errors.title).toBe('Title must be less than 255 characters')
  })

  it('accepts title at exactly max length', () => {
    const maxTitle = 'a'.repeat(255)
    const errors = validateIssueForm({ ...validFormData, title: maxTitle })
    expect(errors.title).toBeUndefined()
  })

  it('returns error when description exceeds max length', () => {
    const longDescription = 'a'.repeat(10001)
    const errors = validateIssueForm({ ...validFormData, description: longDescription })
    expect(errors.description).toBe('Description must be less than 10000 characters')
  })

  it('returns error when status is empty', () => {
    const errors = validateIssueForm({ ...validFormData, status: '' as typeof IssueStatus.TODO })
    expect(errors.status).toBe('Status is required')
  })

  it('returns error when priority is empty', () => {
    const errors = validateIssueForm({ ...validFormData, priority: '' as typeof IssuePriority.MEDIUM })
    expect(errors.priority).toBe('Priority is required')
  })

  it('returns error when type is empty', () => {
    const errors = validateIssueForm({ ...validFormData, type: '' as typeof IssueType.TASK })
    expect(errors.type).toBe('Type is required')
  })
})

describe('hasErrors', () => {
  it('returns false for empty errors object', () => {
    expect(hasErrors({})).toBe(false)
  })

  it('returns true when errors exist', () => {
    expect(hasErrors({ title: 'Title is required' })).toBe(true)
  })
})
