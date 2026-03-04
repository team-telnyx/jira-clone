import { useState, useCallback, useEffect } from 'react'
import type { Issue, IssueFormData, IssueFormErrors, User } from '../types/issue'
import { IssueStatus, IssuePriority, IssueType } from '../types/issue'
import { issueService, userService } from '../api'
import { validateIssueForm, hasErrors } from '../utils/validation'

const getInitialFormData = (issue?: Issue): IssueFormData => ({
  title: issue?.title ?? '',
  description: issue?.description ?? '',
  status: issue?.status ?? IssueStatus.TODO,
  priority: issue?.priority ?? IssuePriority.MEDIUM,
  type: issue?.type ?? IssueType.TASK,
  assigneeId: issue?.assigneeId ?? '',
})

interface UseIssueFormProps {
  issue?: Issue
  onSuccess?: (issue: Issue) => void
  onClose: () => void
}

interface UseIssueFormReturn {
  formData: IssueFormData
  errors: IssueFormErrors
  users: User[]
  isLoading: boolean
  isSubmitting: boolean
  apiError: string | null
  isEditMode: boolean
  handleChange: (field: keyof IssueFormData, value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
}

export function useIssueForm({ issue, onSuccess, onClose }: UseIssueFormProps): UseIssueFormReturn {
  const isEditMode = Boolean(issue?.id)
  
  const [formData, setFormData] = useState<IssueFormData>(() => getInitialFormData(issue))
  const [errors, setErrors] = useState<IssueFormErrors>({})
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await userService.getAll()
        setUsers(fetchedUsers)
      } catch {
        setApiError('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    setFormData(getInitialFormData(issue))
    setErrors({})
    setApiError(null)
  }, [issue])

  const handleChange = useCallback((field: keyof IssueFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    setApiError(null)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateIssueForm(formData)
    setErrors(validationErrors)
    
    if (hasErrors(validationErrors)) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      const payload = {
        ...formData,
        assigneeId: formData.assigneeId || null,
      }

      const savedIssue = isEditMode
        ? await issueService.update(issue!.id, payload)
        : await issueService.create(payload)

      onSuccess?.(savedIssue)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save issue. Please try again.'
      setApiError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isEditMode, issue, onSuccess, onClose])

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(issue))
    setErrors({})
    setApiError(null)
  }, [issue])

  return {
    formData,
    errors,
    users,
    isLoading,
    isSubmitting,
    apiError,
    isEditMode,
    handleChange,
    handleSubmit,
    resetForm,
  }
}
