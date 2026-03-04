import type { IssueFormData, IssueFormErrors } from '../types/issue'

const MAX_TITLE_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 10000

export function validateIssueForm(data: IssueFormData): IssueFormErrors {
  const errors: IssueFormErrors = {}

  if (!data.title.trim()) {
    errors.title = 'Title is required'
  } else if (data.title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`
  }

  if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
  }

  if (!data.status) {
    errors.status = 'Status is required'
  }

  if (!data.priority) {
    errors.priority = 'Priority is required'
  }

  if (!data.type) {
    errors.type = 'Type is required'
  }

  return errors
}

export function hasErrors(errors: IssueFormErrors): boolean {
  return Object.keys(errors).length > 0
}
